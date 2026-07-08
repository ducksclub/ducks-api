import type { Prisma, PrismaClient } from '@prisma/client'
import type { z } from 'zod'
import type {
  createEventSchema,
  eventIdParamsSchema,
  eventListQuerySchema,
  reorderParticipantsSchema,
  updateEventSchema,
} from './events.schemas'

export type EventIdParams = z.infer<typeof eventIdParamsSchema>
export type EventListQuery = z.infer<typeof eventListQuerySchema>
export type CreateEventDto = z.infer<typeof createEventSchema>
export type UpdateEventDto = z.infer<typeof updateEventSchema>
export type ReorderParticipantsDto = z.infer<typeof reorderParticipantsSchema>
export type EventPrismaClient = PrismaClient
export type EventTransactionClient = Prisma.TransactionClient
