import { PromoLinkType } from '@prisma/client'
import { z } from 'zod'

export const promoLinkTypeSchema = z.nativeEnum(PromoLinkType)

export const promoCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9_-]+$/, 'Code may contain only latin letters, numbers, "_" and "-"')

export const createPromoLinkSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: promoLinkTypeSchema,
  code: promoCodeSchema.optional(),
  targetUrl: z.string().trim().min(1).max(500).optional(),
})

export const updatePromoLinkSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    type: promoLinkTypeSchema.optional(),
    targetUrl: z.string().trim().min(1).max(500).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.type !== undefined ||
      value.targetUrl !== undefined ||
      value.isActive !== undefined,
    { message: 'At least one field is required' },
  )

export const promoLinkIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const trackPromoClickSchema = z.object({
  code: promoCodeSchema,
  type: promoLinkTypeSchema,
  telegramUserId: z.union([z.string(), z.number()]).transform(String).optional(),
})

export const telegramStartSchema = z.object({
  telegramUserId: z.union([z.string(), z.number()]).transform(String),
  promoCode: promoCodeSchema,
})

export type CreatePromoLinkDto = z.infer<typeof createPromoLinkSchema>
export type UpdatePromoLinkDto = z.infer<typeof updatePromoLinkSchema>
export type TrackPromoClickDto = z.infer<typeof trackPromoClickSchema>
export type TelegramStartDto = z.infer<typeof telegramStartSchema>
