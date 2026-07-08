export const EVENT_REMINDER_SEARCH_WINDOW_MS = 60 * 1000

export const EVENT_REMINDER_OFFSETS_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '15m': 10 * 60 * 1000,
} as const

export const EVENT_SCORING_BASE_POINTS = [
  { maxPosition: 1, points: 300 },
  { maxPosition: 2, points: 220 },
  { maxPosition: 3, points: 170 },
  { maxPosition: 4, points: 130 },
  { maxPosition: 5, points: 100 },
  { maxPosition: 6, points: 85 },
  { maxPosition: 7, points: 70 },
  { maxPosition: 8, points: 60 },
  { maxPosition: 9, points: 50 },
  { maxPosition: 10, points: 40 },
  { maxPosition: 15, points: 30 },
  { maxPosition: 25, points: 20 },
] as const

export const EVENT_SCORING_DEFAULT_POINTS = 10

export const EVENT_SCORING_MULTIPLIERS = [
  { maxPlayers: 20, multiplier: 1.0 },
  { maxPlayers: 35, multiplier: 1.2 },
  { maxPlayers: 50, multiplier: 1.5 },
  { maxPlayers: 65, multiplier: 1.8 },
] as const

export const EVENT_SCORING_DEFAULT_MULTIPLIER = 2.0
