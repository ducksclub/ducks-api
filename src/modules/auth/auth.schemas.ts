import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
})

export const signUpSchema = z.object({
  email: z.string().email().toLowerCase(),
  nickname: z.string().trim().min(3).max(30),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(6).max(30).optional(),
})

export const signInWithTelegramSchema = z.object({
  initData: z.string().min(1),
})

export const telegramWebAppUserSchema = z.object({
  id: z.number(),
  username: z.string().min(1).max(128).optional(),
  first_name: z.string().min(1).max(128),
  last_name: z.string().min(1).max(128).optional(),
})
