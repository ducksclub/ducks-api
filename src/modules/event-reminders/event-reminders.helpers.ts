import {
  EVENT_REMINDER_OFFSETS_MS,
  EVENT_REMINDER_SEARCH_WINDOW_MS,
} from '../events/events.constants'
import type { ReminderType } from '../../common/types/domain'

export function getEventReminderTarget(type: ReminderType, now = new Date()) {
  const offset = EVENT_REMINDER_OFFSETS_MS[type] ?? EVENT_REMINDER_OFFSETS_MS['15m']

  return new Date(now.getTime() + offset)
}

export function getEventReminderDateRange(target: Date) {
  return {
    gte: new Date(target.getTime() - EVENT_REMINDER_SEARCH_WINDOW_MS),
    lte: new Date(target.getTime() + EVENT_REMINDER_SEARCH_WINDOW_MS),
  }
}

export function getReminderSentFilter(type: ReminderType) {
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
