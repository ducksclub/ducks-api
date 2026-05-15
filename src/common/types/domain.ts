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
  active: 'active',
  cancelled: 'cancelled',
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
