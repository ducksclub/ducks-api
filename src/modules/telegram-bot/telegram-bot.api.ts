import axios from 'axios'
import { env } from '../../config/env.js'

export const EventRegistrationNotificationTypes = {
  registeredAsParticipant: 'REGISTERED_AS_PARTICIPANT',
  addedToWaitingList: 'ADDED_TO_WAITING_LIST',
  waitingListPromoted: 'WAITING_LIST_PROMOTED',
} as const

export type EventRegistrationNotificationType =
  (typeof EventRegistrationNotificationTypes)[keyof typeof EventRegistrationNotificationTypes]

export type EventRegistrationNotificationPayload = {
  message: string
  telegramUserId: number
}

export async function sendEventNotification(payload: EventRegistrationNotificationPayload) {
  try {
    const { data } = await axios.post(`${env.TELEGRAM_BOT_API_URL}/notification`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Telegram bot notification response:', data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Telegram bot notification failed', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })

      return
    }

    console.error('Telegram bot notification failed', error)
  }
}
