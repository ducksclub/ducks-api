import { z } from 'zod'

const nicknameSchema = z
  .string()
  .trim()
  .min(3, 'nickname должен содержать минимум 3 символа')
  .max(30, 'nickname слишком длинный')
  .regex(/^[a-zA-Z0-9_]+$/, 'nickname может содержать только буквы, цифры и "_"')

const profileFieldsSchema = z.object({
  phone: z.string().trim().min(6, 'Введите корректный номер телефона'),
  nickname: nicknameSchema,
  avatarUrl: z.string().trim().or(z.literal('')),
  avatarHash: z.string().trim().or(z.literal('')),
})

export const updateProfileSchema = profileFieldsSchema
  .partial()
  .refine(
    (value) =>
      value.phone !== undefined ||
      value.nickname !== undefined ||
      value.avatarUrl !== undefined ||
      value.avatarHash !== undefined,
    { message: `Требуется заполнить хотя бы одно поле` },
  )

export const getProfileByNicknameQuerySchema = z.object({
  nickname: nicknameSchema,
})

export const getProfileByTelegramIdParamsSchema = z.object({
  telegramId: z.string().trim().min(1, 'telegramId обязателен'),
})

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
export type GetProfileByNicknameQueryDto = z.infer<typeof getProfileByNicknameQuerySchema>
export type GetProfileByTelegramIdParamsDto = z.infer<typeof getProfileByTelegramIdParamsSchema>
