import { WarmupService } from '../warmups/warmup.service'
import { EventRegistrationsRepository } from './event-registrations.repository'
import { EventRegistrationFlowService } from './event-registration-flow.service'
import { badRequest, conflict, notFound } from '../../common/errors/app-error'
import { EventStatuses, RegistrationStatuses } from '../../common/types/domain'
import {
  type EventRegistrationNotificationPayload,
  sendEventNotification,
} from '../telegram-bot/telegram-bot.api'
import type { EventPrismaClient } from '../events/events.types'

export class EventRegistrationsService {
  private readonly repository: EventRegistrationsRepository
  private readonly flow: EventRegistrationFlowService
  private readonly warmupService: WarmupService

  constructor(prisma: EventPrismaClient) {
    this.repository = new EventRegistrationsRepository(prisma)
    this.flow = new EventRegistrationFlowService(this.repository)
    this.warmupService = new WarmupService(prisma)
  }

  async getUserRegistration(userId: string, eventId: string) {
    return this.repository.findUserRegistration(userId, eventId)
  }

  async getMyEventSeat(eventId: string, userId: string) {
    const event = await this.repository.findEvent(eventId)

    if (!event) throw notFound('Не удалось найти событие')

    if (!this.flow.isPokerEvent(event.gameType)) {
      throw badRequest('Логика мест доступна только для покера')
    }

    const registration = await this.repository.findUserRegistration(userId, eventId)

    if (
      !registration ||
      (registration.status !== RegistrationStatuses.registered &&
        registration.status !== RegistrationStatuses.waiting)
    ) {
      throw notFound('Регистрация на мероприятие не найдена')
    }

    if (registration.status === RegistrationStatuses.waiting) {
      const waitingPosition = await this.flow.getWaitingPosition(eventId, registration.createdAt)

      return {
        status: RegistrationStatuses.waiting,
        message: 'Вы в списке ожидания',
        waitingPosition,
      }
    }

    if (!this.flow.isSeatVisible(event)) {
      return {
        status: 'HIDDEN_UNTIL_15_MIN',
        message: 'Место будет доступно за 15 минут до начала игры',
        availableAt: this.flow.getSeatAvailableAt(event).toISOString(),
      }
    }

    return {
      status: 'SEAT_ASSIGNED',
      message: 'Ваше место назначено',
      tableNumber: registration.tableNumber,
      seatNumber: registration.seatNumber,
    }
  }

  async registerUser(eventId: string, userId: string) {
    try {
      const result = await this.repository.transaction(async (tx) => {
        const event = await this.repository.findEventForRegistration(tx, eventId)

        if (!event) throw notFound('Не удалось найти событие')

        if (event.status !== EventStatuses.published) {
          throw badRequest('Регистрация на это событие закрыта')
        }

        const existing = await this.repository.findByUserAndEvent(tx, userId, eventId)

        if (
          existing &&
          (existing.status === RegistrationStatuses.registered ||
            existing.status === RegistrationStatuses.waiting)
        ) {
          throw conflict('Вы уже зарегистрированы на это событие')
        }

        const user = await this.repository.findUserTelegramId(tx, userId)

        if (this.flow.isPokerEvent(event.gameType)) {
          return this.flow.registerPokerUser(
            tx,
            eventId,
            userId,
            event,
            user?.telegramId ?? null,
            existing,
          )
        }

        return this.flow.registerLimitedUser(
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

      if (!event) throw notFound('Событие не найдено')

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
        const promoted = await this.flow.promoteNextWaitingUser(tx, eventId, event, {
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
}
