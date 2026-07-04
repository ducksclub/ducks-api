import { Router } from 'express'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/async-handler'
import { getReminders } from './event-reminders.controller'
import { eventRemindersParamsSchema } from './event-reminders.schemas'

export const eventRemindersRouter = Router()

eventRemindersRouter.get(
  '/',
  validate({ params: eventRemindersParamsSchema }),
  asyncHandler(getReminders),
)
