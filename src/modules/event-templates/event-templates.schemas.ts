import { z } from 'zod'
import { enumValues, EventStatuses, GameTypes } from '../../common/types/domain'

export const eventTemplateListQuerySchema = z.object({
  gameType: z.enum(enumValues(GameTypes)).optional(),
  status: z.enum(enumValues(EventStatuses)).optional(),
})
