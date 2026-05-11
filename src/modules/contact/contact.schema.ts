import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  city: z.string().min(2),
})
