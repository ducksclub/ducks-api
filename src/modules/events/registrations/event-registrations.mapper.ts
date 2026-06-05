import type {
  EventRegistrationNotificationPayload,
  EventRegistrationNotificationType,
} from '../../telegram-bot/telegram-bot.api.js'
import { RegistrationEvent } from '../events.types.js'
import { createEventRegistrationMessage } from '../../../constants/messages.js'

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
