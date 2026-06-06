import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
  initData: z.string().min(1).optional(),
})

export const signUpSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  username: z.string().trim().min(3).max(30),
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

export const signInWithTelegramSchema = z.object({
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

export const telegramWebAppUserSchema = z.object({
  id: z.number(),
  username: z.string().min(1).max(128).optional(),
  first_name: z.string().min(1).max(128),
  last_name: z.string().min(1).max(128).optional(),
})
