import { z } from 'zod'
import { enumValues, ReminderTypes } from '../../common/types/domain'

export const eventRemindersParamsSchema = z.object({
  type: z.enum(enumValues(ReminderTypes)).optional(),
})
