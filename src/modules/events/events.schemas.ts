import { z } from 'zod'
import { enumValues, EventStatuses, GameTypes } from '../../common/types/domain.js'
import { paginationSchema } from '../../common/utils/pagination.js'

export const eventIdParamsSchema = z.object({ id: z.string().min(1) })

export const eventListQuerySchema = paginationSchema.extend({
  gameType: z.enum(enumValues(GameTypes)).optional(),
  status: z.enum(enumValues(EventStatuses)).optional(),
})

const eventBaseSchema = z.object({
  title: z.string().max(100),
  city: z.string().max(100),
  address: z.string().max(200),
  features: z.string().max(3000),
  gameRules: z.string().max(3000),
  gameType: z.enum(enumValues(GameTypes)),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  participantLimit: z.number().int().min(1).max(10000),
  seatsPerTable: z.number().int().min(1).max(1000).default(9),
  initialDepositAmount: z.number().int().min(0).max(100000000).default(0),
  status: z.enum(enumValues(EventStatuses)).default(EventStatuses.published),
  isTemplate: z.boolean().optional().default(false),
  imageUrl: z.string().optional(),
  imageHash: z.string().optional(),
})

export const createEventSchema = eventBaseSchema.refine(
  (data) => !data.endsAt || data.endsAt > data.startsAt,
  {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  },
)

export const updateEventSchema = eventBaseSchema
  .partial()
  .refine((data) => !data.endsAt || !data.startsAt || data.endsAt > data.startsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  })

export const manageParticipantSchema = z.object({
  userId: z.string().min(1),
})

export const reorderParticipantsSchema = z.object({
  participants: z
    .array(
      z.object({
        userId: z.string().min(1),
        points: z.number().int().min(0),
        bounty: z.number().int().min(0),
      }),
    )
    .refine(
      (participants) => new Set(participants.map(({ userId }) => userId)).size === participants.length,
      { message: 'Participant userIds must be unique' },
    ),
})
