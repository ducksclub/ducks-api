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

type SendEventNotificationOptions = {
  throwOnError?: boolean
  timeoutMs?: number
}

export async function sendEventNotification(
  payload: EventRegistrationNotificationPayload,
  options: SendEventNotificationOptions = {},
) {
  try {
    const { data } = await axios.post(`${env.TELEGRAM_BOT_API_URL}/notification`, payload, {
      timeout: options.timeoutMs ?? 10_000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Telegram bot notification response:', data)
    console.log('Telegram bot notification payload:', payload)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Telegram bot notification failed', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      })

      if (options.throwOnError) {
        const responseData =
          error.response?.data === undefined ? '' : `: ${JSON.stringify(error.response.data)}`

        throw new Error(`${error.message}${responseData}`)
      }

      return
    }

    console.error('Telegram bot notification failed', error)

    if (options.throwOnError) throw error
  }
}
