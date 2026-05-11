export const Roles = {
  user: 'user',
  admin: 'admin',
} as const

export type Role = (typeof Roles)[keyof typeof Roles]

export const GameTypes = {
  poker: 'poker',
  darts: 'darts',
  billiards: 'billiards',
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
  rules: 'rules',
  about: 'about',
  faq: 'faq',
} as const

export type ContentPageKey = (typeof ContentPageKeys)[keyof typeof ContentPageKeys]

export const enumValues = <T extends Record<string, string>>(values: T) =>
  Object.values(values) as [T[keyof T], ...Array<T[keyof T]>]
