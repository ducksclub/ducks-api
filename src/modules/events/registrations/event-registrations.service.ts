import { badRequest, conflict, notFound } from '../../../common/errors/app-error.js'
import { EventStatuses, RegistrationStatuses } from '../../../common/types/domain.js'
import {
  EventRegistrationNotificationTypes,
  type EventRegistrationNotificationPayload,
  sendEventNotification,
} from '../../telegram-bot/telegram-bot.api.js'
import { EventRegistrationsRepository } from './event-registrations.repository.js'
import { buildEventRegistrationNotificationPayload } from './event-registrations.mapper.js'
import type {
  PreferredSeat,
  EventPrismaClient,
  EventTransactionClient,
  RegistrationEvent,
  RegistrationEventWithCount,
} from '../events.types.js'
import { PokerSeatsService } from '../poker-seats/poker-seats.service.js'
import { WarmupService } from '../../warmups/warmup.service.js'

export class EventRegistrationsService {
  private readonly repository: EventRegistrationsRepository
  private readonly warmupService: WarmupService

  constructor(
    prisma: EventPrismaClient,
    private readonly pokerSeats: PokerSeatsService,
  ) {
    this.repository = new EventRegistrationsRepository(prisma)
    this.warmupService = new WarmupService(prisma)
  }

  async registerUser(eventId: string, userId: string) {
    try {
      const result = await this.repository.transaction(async (tx) => {
        const event = await this.repository.findEventForRegistration(tx, eventId)

        if (!event) throw notFound('Event not found')

        if (event.status !== EventStatuses.published) {
          throw badRequest('Registration is available only for published events')
        }

        const existing = await this.repository.findByUserAndEvent(tx, userId, eventId)

        if (
          existing &&
          (existing.status === RegistrationStatuses.registered ||
            existing.status === RegistrationStatuses.waiting)
        ) {
          throw conflict('Already registered for this event')
        }

        const user = await this.repository.findUserTelegramId(tx, userId)

        if (this.pokerSeats.isPokerEvent(event.gameType)) {
          return this.registerPokerUser(
            tx,
            eventId,
            userId,
            event,
            user?.telegramId ?? null,
            existing,
          )
        }

        return this.registerLimitedUser(
          tx,
          eventId,
          userId,
          event,
          user?.telegramId ?? null,
          existing,
        )
      })

      await sendEventNotification(result.notification!)
      await this.warmupService.stopAbandonedRegistrationWarmup(userId)

      return result.registration
    } catch (error) {
      if (this.repository.isUniqueConstraintError(error)) {
        throw conflict('Место уже занято, попробуйте записаться ещё раз')
      }

      throw error
    }
  }

  async cancelRegistration(eventId: string, userId: string) {
    const result = await this.repository.transaction(async (tx) => {
      const event = await this.repository.findEvent(tx, eventId)

      if (!event) throw notFound('Event not found')

      const registration = await this.repository.findByUserAndEvent(tx, userId, eventId)

      if (
        !registration ||
        (registration.status !== RegistrationStatuses.registered &&
          registration.status !== RegistrationStatuses.waiting)
      ) {
        throw notFound('Активная регистрация не найдена')
      }

      const cancelledRegistration = await this.repository.cancelRegistration(tx, registration.id)
      let promotedNotification: EventRegistrationNotificationPayload | null = null

      if (registration.status === RegistrationStatuses.registered) {
        const promoted = await this.promoteNextWaitingUser(tx, eventId, event, {
          tableNumber: registration.tableNumber,
          seatNumber: registration.seatNumber,
        })

        promotedNotification = promoted?.notification ?? null
      }

      return {
        registration: cancelledRegistration,
        promotedNotification,
      }
    })

    // При отмене всплывает уведомление
    // await sendEventNotification(result.promotedNotification!)

    return result.registration
  }

  async getMySeat(eventId: string, userId: string) {
    const event = await this.repository.findEventOutsideTransaction(eventId)

    if (!event) throw notFound('Event not found')

    if (!this.pokerSeats.isPokerEvent(event.gameType)) {
      throw badRequest('Логика мест доступна только для покера')
    }

    const registration = await this.repository.findByUserAndEventOutsideTransaction(userId, eventId)

    if (
      !registration ||
      (registration.status !== RegistrationStatuses.registered &&
        registration.status !== RegistrationStatuses.waiting)
    ) {
      throw notFound('Регистрация на мероприятие не найдена')
    }

    if (registration.status === RegistrationStatuses.waiting) {
      const waitingPosition = await this.getWaitingPositionOutsideTransaction(
        eventId,
        registration.createdAt,
      )

      return {
        status: RegistrationStatuses.waiting,
        message: 'Вы в списке ожидания',
        waitingPosition,
      }
    }

    if (!this.pokerSeats.isSeatVisible(event)) {
      return {
        status: 'HIDDEN_UNTIL_15_MIN',
        message: 'Место будет доступно за 15 минут до начала игры',
        availableAt: this.pokerSeats.getSeatAvailableAt(event).toISOString(),
      }
    }

    return {
      status: 'SEAT_ASSIGNED',
      message: 'Ваше место назначено',
      tableNumber: registration.tableNumber,
      seatNumber: registration.seatNumber,
    }
  }

  async getUserRegistration(userId: string, eventId: string) {
    return this.repository.findByUserAndEventOutsideTransaction(userId, eventId)
  }

  private async registerPokerUser(
    tx: EventTransactionClient,
    eventId: string,
    userId: string,
    event: RegistrationEvent,
    telegramId: string | null,
    existing: { id: string } | null,
  ) {
    const seat = await this.pokerSeats.getNextPokerSeat(tx, eventId, event)
    const status = seat ? RegistrationStatuses.registered : RegistrationStatuses.waiting

    const savedRegistration = existing
      ? await this.repository.reactivateRegistration(tx, existing.id, {
          status,
          tableNumber: seat?.tableNumber ?? null,
          seatNumber: seat?.seatNumber ?? null,
        })
      : await this.repository.createRegistration(tx, {
          userId,
          eventId,
          status,
          tableNumber: seat?.tableNumber ?? null,
          seatNumber: seat?.seatNumber ?? null,
        })

    if (status === RegistrationStatuses.waiting) {
      const waitingPosition = await this.getWaitingPosition(
        tx,
        eventId,
        savedRegistration.createdAt,
      )

      return {
        registration: {
          ...savedRegistration,
          message: 'Основные места заняты. Вы добавлены в список ожидания',
          isWaiting: true,
          waitingPosition,
        },
        notification: buildEventRegistrationNotificationPayload({
          type: EventRegistrationNotificationTypes.addedToWaitingList,
          event,
          telegramId,
          waitingPosition,
        }),
      }
    }

    return {
      registration: {
        ...savedRegistration,
        message: 'Вы успешно записаны на игру',
        isWaiting: false,
      },
      notification: buildEventRegistrationNotificationPayload({
        type: EventRegistrationNotificationTypes.registeredAsParticipant,
        event,
        telegramId,
      }),
    }
  }

  private async registerLimitedUser(
    tx: EventTransactionClient,
    eventId: string,
    userId: string,
    event: RegistrationEventWithCount,
    telegramId: string | null,
    existing: { id: string } | null,
  ) {
    const status =
      event._count.registrations < event.participantLimit
        ? RegistrationStatuses.registered
        : RegistrationStatuses.waiting

    const registration = existing
      ? await this.repository.reactivateRegistration(tx, existing.id, {
          status,
          tableNumber: null,
          seatNumber: null,
        })
      : await this.repository.createRegistration(tx, {
          userId,
          eventId,
          status,
          tableNumber: null,
          seatNumber: null,
        })

    if (status === RegistrationStatuses.waiting) {
      const waitingPosition = await this.getWaitingPosition(tx, eventId, registration.createdAt)

      return {
        registration: {
          ...registration,
          isWaiting: true,
          waitingPosition,
        },
        notification: buildEventRegistrationNotificationPayload({
          type: EventRegistrationNotificationTypes.addedToWaitingList,
          telegramId,
          event,
          waitingPosition,
        }),
      }
    }

    return {
      registration: {
        ...registration,
        isWaiting: false,
      },
      notification: buildEventRegistrationNotificationPayload({
        type: EventRegistrationNotificationTypes.registeredAsParticipant,
        event,
        telegramId,
      }),
    }
  }

  private async promoteNextWaitingUser(
    tx: EventTransactionClient,
    eventId: string,
    event: RegistrationEvent,
    preferredSeat?: PreferredSeat,
  ) {
    const nextWaiting = await this.repository.findNextWaitingRegistration(tx, eventId)

    if (!nextWaiting) return null

    const isPoker = this.pokerSeats.isPokerEvent(event.gameType)
    const seat =
      isPoker && preferredSeat?.tableNumber && preferredSeat.seatNumber
        ? {
            tableNumber: preferredSeat.tableNumber,
            seatNumber: preferredSeat.seatNumber,
          }
        : isPoker
          ? await this.pokerSeats.getNextPokerSeat(tx, eventId, event)
          : null

    if (isPoker && !seat) return null

    const promotedRegistration = await this.repository.promoteWaitingRegistration(
      tx,
      nextWaiting.id,
      seat,
    )
    const user = await this.repository.findUserTelegramId(tx, promotedRegistration.userId)

    return {
      registration: promotedRegistration,
      notification: buildEventRegistrationNotificationPayload({
        type: EventRegistrationNotificationTypes.waitingListPromoted,
        telegramId: user?.telegramId ?? null,
        event,
      }),
    }
  }

  private async getWaitingPosition(tx: EventTransactionClient, eventId: string, createdAt: Date) {
    const waitingBefore = await this.repository.countWaitingBefore(tx, eventId, createdAt)

    return waitingBefore + 1
  }

  private async getWaitingPositionOutsideTransaction(eventId: string, createdAt: Date) {
    const waitingBefore = await this.repository.countWaitingBeforeOutsideTransaction(
      eventId,
      createdAt,
    )

    return waitingBefore + 1
  }
}
