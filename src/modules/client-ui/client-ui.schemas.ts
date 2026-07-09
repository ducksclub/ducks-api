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
