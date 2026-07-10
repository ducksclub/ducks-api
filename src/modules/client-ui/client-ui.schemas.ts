import { z } from 'zod'

export const ClientUiTypes = {
  POKER: 'ПОКЕР',
  DEALER: 'ДИЛЕР',
  FLOOR: 'ФЛОР',
  ADMINISTRATOR: 'АДМИНИСТРАТОР',
  MANAGER: 'УПРАВЛЯЮЩИЙ',
} as const

export const clientUiTypeSchema = z.enum([
  ClientUiTypes.POKER,
  ClientUiTypes.DEALER,
  ClientUiTypes.FLOOR,
  ClientUiTypes.ADMINISTRATOR,
  ClientUiTypes.MANAGER,
])

export const changeClientUiSchema = z
  .object({
    type: clientUiTypeSchema,
  })
  .strict()

export type ChangeClientUiDto = z.infer<typeof changeClientUiSchema>

export const clientUiRegistrationQuerySchema = z
  .object({
    type: clientUiTypeSchema,
  })
  .strict()

export const createClientUiRegistrationSchema = z
  .object({
    type: clientUiTypeSchema,
  })
  .strict()

export type ClientUiRegistrationQueryDto = z.infer<typeof clientUiRegistrationQuerySchema>
export type CreateClientUiRegistrationDto = z.infer<typeof createClientUiRegistrationSchema>
