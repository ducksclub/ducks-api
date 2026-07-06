import { Router } from 'express'
import { authenticate } from '../../common/middleware/auth'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/async-handler'
import { eventIdParamsSchema } from './event-registrations.schemas'
import {
  cancelEventRegistration,
  checkEvent,
  getMyEventSeat,
  registerForEvent,
} from './event-registrations.controller'

export const eventRegistrationsRouter = Router()

eventRegistrationsRouter.get(
  '/:id/check',
  authenticate,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(checkEvent),
)

eventRegistrationsRouter.get(
  '/:id/seat/me',
  authenticate,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(getMyEventSeat),
)

eventRegistrationsRouter.post(
  '/:id/register',
  authenticate,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(registerForEvent),
)

eventRegistrationsRouter.post(
  '/:id/cancel',
  authenticate,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(cancelEventRegistration),
)
