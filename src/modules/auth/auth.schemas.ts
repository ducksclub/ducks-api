import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(6).max(30).optional(),
  promoCode: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  sourceCode: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  initData: z.string().min(1).optional(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
})

export const telegramAuthSchema = z.object({
  initData: z.string().min(1),
  promoCode: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  sourceCode: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
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
