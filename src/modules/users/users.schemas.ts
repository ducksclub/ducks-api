import { z } from 'zod'

export const updateProfileSchema = z.object({
  phone: z.string().trim().min(6, 'Введите корректный номер телефона'),
  username: z
    .string()
    .trim()
    .min(3, 'Username должен содержать минимум 3 символа')
    .max(30, 'Username слишком длинный')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username может содержать только буквы, цифры и "_"'),
  avatarUrl: z.string().trim().optional().or(z.literal('')),
  avatarHash: z.string().trim().optional().or(z.literal('')),
})

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
