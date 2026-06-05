import type { Prisma, PrismaClient } from '@prisma/client'
import type { z } from 'zod'
import type {
  createEventSchema,
  eventIdParamsSchema,
  eventListQuerySchema,
  reorderParticipantsSchema,
  updateEventSchema,
} from './events.schemas.js'

export type EventIdParams = z.infer<typeof eventIdParamsSchema>
export type EventListQuery = z.infer<typeof eventListQuerySchema>
export type CreateEventDto = z.infer<typeof createEventSchema>
export type UpdateEventDto = z.infer<typeof updateEventSchema>
export type ReorderParticipantsDto = z.infer<typeof reorderParticipantsSchema>
export type EventPrismaClient = PrismaClient
export type EventTransactionClient = Prisma.TransactionClient

export type PokerSeat = {
  tableNumber: number
  seatNumber: number
}

export type PreferredSeat = {
  tableNumber: number | null
  seatNumber: number | null
}

export type PokerSeatLayoutEvent = {
  gameType: string
  participantLimit: number
  seatsPerTable: number
}

export type RegistrationEvent = {
  title: string
  startsAt: Date
  city: string
  address: string
  gameType: string
  participantLimit: number
  seatsPerTable: number
}

export type RegistrationEventWithCount = RegistrationEvent & {
  _count: {
    registrations: number
  }
}

export type EventReminderType = '24h' | '2h' | '15m'
