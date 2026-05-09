import { z } from 'zod'

export const botRegisterSchema = z.object({
  eventId: z.string().min(1),
  telegramUserId: z.string().min(1),
})
