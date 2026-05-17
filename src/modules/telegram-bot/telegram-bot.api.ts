import { env } from '../../config/env.js'

export const EventRegistrationNotificationTypes = {
  registeredAsParticipant: 'REGISTERED_AS_PARTICIPANT',
  addedToWaitingList: 'ADDED_TO_WAITING_LIST',
  waitingListPromoted: 'WAITING_LIST_PROMOTED',
} as const

export type EventRegistrationNotificationType =
  (typeof EventRegistrationNotificationTypes)[keyof typeof EventRegistrationNotificationTypes]

export type EventRegistrationNotificationPayload = {
  type: EventRegistrationNotificationType
  telegramUserId: number
  eventTitle: string
  eventDate: string
  eventAddress: string
  waitingPosition?: number
}

export async function sendEventRegistrationNotification(
  payload: EventRegistrationNotificationPayload | null,
) {
  if (!payload) return

  if (!env.TELEGRAM_BOT_API_URL || !env.INTERNAL_API_TOKEN) {
    console.error('Telegram bot notification skipped: TELEGRAM_BOT_API_URL or INTERNAL_API_TOKEN is not configured')
    return
  }

  try {
    const response = await fetch(
      `${env.TELEGRAM_BOT_API_URL}/internal/notifications/event-registration`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-token': env.INTERNAL_API_TOKEN,
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '')
      console.error('Telegram bot notification failed', {
        status: response.status,
        body: responseBody,
      })
    }
  } catch (error) {
    console.error('Telegram bot notification failed', error)
  }
}
