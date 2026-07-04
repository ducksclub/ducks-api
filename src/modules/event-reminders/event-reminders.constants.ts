export const EVENT_REMINDER_SEARCH_WINDOW_MS = 60 * 1000

export const EVENT_REMINDER_OFFSETS_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '15m': 10 * 60 * 1000,
} as const
