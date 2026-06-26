import z from 'zod'
import { publicUserSelect, userWithPasswordSelect } from './auth.helpers'
import {
  nicknameAvailabilitySchema,
  signInSchema,
  signUpSchema,
  telegramWebAppUserSchema,
} from './auth.schemas'
import type { Prisma } from '@prisma/client'

export type SignInDto = z.infer<typeof signInSchema>
export type SignUpDto = z.infer<typeof signUpSchema>
export type NicknameAvailabilityDto = z.infer<typeof nicknameAvailabilitySchema>
export type TelegramWebAppUserDto = z.infer<typeof telegramWebAppUserSchema>

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect
}>

export type UserWithPassword = Prisma.UserGetPayload<{
  select: typeof userWithPasswordSelect
}>
