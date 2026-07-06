import type {
  EventRegistrationNotificationPayload,
  EventRegistrationNotificationType,
} from '../telegram-bot/telegram-bot.api'
import { createEventRegistrationMessage } from '../../constants/messages'
import { getPokerSeatLayout, isPokerEvent } from './event-registrations.helpers'
import type { PokerSeatLayoutEvent, RegistrationEvent } from './event-registrations.types'

export function buildEventRegistrationNotificationPayload(params: {
  type: EventRegistrationNotificationType
  event: RegistrationEvent
  telegramId: string | null
  waitingPosition?: number
}): EventRegistrationNotificationPayload | null {
  if (!params.telegramId) return null

  const telegramUserId = Number(params.telegramId)
  if (!Number.isFinite(telegramUserId)) return null

  const message = createEventRegistrationMessage(params.event)

  return {
    telegramUserId,
    message,
  }
}

export function mapEventWithPokerSeatLayout<T extends PokerSeatLayoutEvent>(event: T) {
  if (!isPokerEvent(event.gameType)) return event

  return {
    ...event,
    tableCount: getPokerSeatLayout(event.participantLimit, event.seatsPerTable).tableCount,
  }
}
