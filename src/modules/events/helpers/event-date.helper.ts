import { EVENT_REMINDER_OFFSETS_MS, EVENT_REMINDER_SEARCH_WINDOW_MS } from '../events.constants'
import type { EventReminderType } from '../events.types'

export function getEventReminderTarget(type: EventReminderType, now = new Date()) {
  const offset = EVENT_REMINDER_OFFSETS_MS[type] ?? EVENT_REMINDER_OFFSETS_MS['15m']

  return new Date(now.getTime() + offset)
}

export function getEventReminderDateRange(target: Date) {
  return {
    gte: new Date(target.getTime() - EVENT_REMINDER_SEARCH_WINDOW_MS),
    lte: new Date(target.getTime() + EVENT_REMINDER_SEARCH_WINDOW_MS),
  }
}
