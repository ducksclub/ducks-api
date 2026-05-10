import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100).optional(),
  initData: z.string().min(1).optional(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
})

export const telegramAuthSchema = z.object({
  initData: z.string().min(1),
})

export const telegramUserSchema = z.object({
  id: z.number(),
  username: z.string().min(1).max(128),
  first_name: z.string().min(1).max(128),
  last_name: z.string().min(1).max(128),
})

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type TelegramUserDto = z.infer<typeof telegramUserSchema>
