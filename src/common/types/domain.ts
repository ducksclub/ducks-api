export const Roles = {
  user: 'user',
  admin: 'admin',
} as const

export type Role = (typeof Roles)[keyof typeof Roles]

export const GameTypes = {
  poker: 'poker',
  darts: 'darts',
  pool: 'pool',
  quiz: 'quiz',
  mafia: 'mafia',
} as const

export type GameType = (typeof GameTypes)[keyof typeof GameTypes]

export const EventStatuses = {
  draft: 'draft',
  published: 'published',
  cancelled: 'cancelled',
  completed: 'completed',
} as const

export type EventStatus = (typeof EventStatuses)[keyof typeof EventStatuses]

export const RegistrationStatuses = {
  registered: 'PARTICIPANT',
  waiting: 'WAITING',
  cancelled: 'CANCELLED',
} as const

export type RegistrationStatus = (typeof RegistrationStatuses)[keyof typeof RegistrationStatuses]

export const ContentPageKeys = {
  FAQ: 'faq',
  RULES: 'rules',
  ABOUT: 'about',
  POKER_LEVELS: 'poker-levels',
} as const

export type ContentPageKey = (typeof ContentPageKeys)[keyof typeof ContentPageKeys]

export const enumValues = <T extends Record<string, string>>(values: T) =>
  Object.values(values) as [T[keyof T], ...Array<T[keyof T]>]

export const WarmupStatuses = {
  active: 'active',
  completed: 'completed',
  stopped: 'stopped',
} as const

export type WarmupStatus = (typeof WarmupStatuses)[keyof typeof WarmupStatuses]

export const WarmupScenarioKeys = {
  abandonedRegistration: 'abandoned_registration',
} as const

export type WarmupScenarioKey = (typeof WarmupScenarioKeys)[keyof typeof WarmupScenarioKeys]

export const ReminderTypes = {
  DAY_BEFORE: '24h',
  TWO_HOURS_BEFORE: '2h',
  FIFTEEN_MINUTES_BEFORE: '15m',
} as const

export type ReminderType = (typeof ReminderTypes)[keyof typeof ReminderTypes]
