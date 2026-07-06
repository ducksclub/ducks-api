import { RegistrationStatuses } from '../../common/types/domain'
import { EventRegistrationsRepository } from './event-registrations.repository'
import { EventRegistrationNotificationTypes } from '../telegram-bot/telegram-bot.api'
import {
  buildEventRegistrationNotificationPayload,
  mapEventWithPokerSeatLayout,
} from './event-registrations.mapper'
import {
  findFirstAvailablePokerSeat,
  getSeatAvailableAt,
  isPokerEvent,
  isSeatVisible,
} from './event-registrations.helpers'
import type { EventTransactionClient } from '../events/events.types'
import type {
  PokerSeatLayoutEvent,
  PreferredSeat,
  RegistrationEvent,
  RegistrationEventWithCount,
} from './event-registrations.types'

export class EventRegistrationFlowService {
  constructor(private readonly repository: EventRegistrationsRepository) {}

  async registerPokerUser(
    tx: EventTransactionClient,
    eventId: string,
    userId: string,
    event: RegistrationEvent,
    telegramId: string | null,
    existing: { id: string } | null,
  ) {
    const seat = await this.getNextPokerSeat(tx, eventId, event)
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
      const waitingPosition = await this.getWaitingPosition(eventId, savedRegistration.createdAt)

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

  async registerLimitedUser(
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
      const waitingPosition = await this.getWaitingPosition(eventId, registration.createdAt)

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

  async promoteNextWaitingUser(
    tx: EventTransactionClient,
    eventId: string,
    event: RegistrationEvent,
    preferredSeat?: PreferredSeat,
  ) {
    const nextWaiting = await this.repository.findNextWaitingRegistration(tx, eventId)

    if (!nextWaiting) return null

    const isPoker = this.isPokerEvent(event.gameType)
    const seat =
      isPoker && preferredSeat?.tableNumber && preferredSeat.seatNumber
        ? {
            tableNumber: preferredSeat.tableNumber,
            seatNumber: preferredSeat.seatNumber,
          }
        : isPoker
          ? await this.getNextPokerSeat(tx, eventId, event)
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

  async getWaitingPosition(eventId: string, createdAt: Date) {
    const waitingBefore = await this.repository.countWaitingBefore(eventId, createdAt)
    return waitingBefore + 1
  }

  isPokerEvent(gameType: string) {
    return isPokerEvent(gameType)
  }

  getSeatAvailableAt(event: { startsAt: Date }) {
    return getSeatAvailableAt(event)
  }

  isSeatVisible(event: { startsAt: Date }) {
    return isSeatVisible(event)
  }

  withPokerSeatLayout<T extends PokerSeatLayoutEvent>(event: T) {
    return mapEventWithPokerSeatLayout(event)
  }

  async getNextPokerSeat(
    tx: EventTransactionClient,
    eventId: string,
    event: { participantLimit: number; seatsPerTable: number },
  ) {
    const occupiedSeats = await this.repository.findOccupiedSeats(tx, eventId)

    return findFirstAvailablePokerSeat(event, occupiedSeats)
  }
}
