import { z } from 'zod'
import { paginationSchema } from '../../common/utils/pagination.js'

export const createBroadcastSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Текст рассылки обязателен')
    .max(4000, 'Текст рассылки слишком длинный'),
})

export type CreateBroadcastDto = z.infer<typeof createBroadcastSchema>

export const broadcastListQuerySchema = paginationSchema

export const broadcastIdParamsSchema = z.object({
  id: z.string().min(1),
})

export type BroadcastListQuery = z.infer<typeof broadcastListQuerySchema>
