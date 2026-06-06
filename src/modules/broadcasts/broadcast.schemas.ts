import { z } from 'zod'

export const createBroadcastSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Текст рассылки обязателен')
    .max(4000, 'Текст рассылки слишком длинный'),
})

export type CreateBroadcastDto = z.infer<typeof createBroadcastSchema>
