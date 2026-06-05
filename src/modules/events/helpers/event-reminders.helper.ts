import type { EventReminderType } from '../events.types'

export function getReminderSentFilter(type: EventReminderType) {
  switch (type) {
    case '24h':
      return {
        reminderSent24h: false,
      }

    case '2h':
      return {
        reminderSent2h: false,
      }

    case '15m':
      return {
        reminderSent15m: false,
      }

    default:
      throw new Error(`Неизвестный тип напоминания: ${type}`)
  }
}
