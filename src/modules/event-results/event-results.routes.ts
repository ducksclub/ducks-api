import { Router } from 'express'
import { Roles } from '../../common/types/domain'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/async-handler'
import { authenticate, authorize } from '../../common/middleware/auth'
import { eventIdParamsSchema, reorderParticipantsSchema } from '../events/events.schemas'
import {
  finalizeEvent,
  getEventParticipants,
  reorderParticipants,
} from './event-results.controller'

export const eventResultsRouter = Router()

eventResultsRouter.get(
  '/:id/participants',
  // authenticate,
  // authorize(Roles.admin),
  validate({ params: eventIdParamsSchema }),
  asyncHandler(getEventParticipants),
)

eventResultsRouter.patch(
  '/:id/participants/reorder',
  authenticate,
  authorize(Roles.admin),
  validate({
    params: eventIdParamsSchema,
    body: reorderParticipantsSchema,
  }),
  asyncHandler(reorderParticipants),
)

eventResultsRouter.post(
  '/:id/finalize',
  authenticate,
  authorize(Roles.admin),
  validate({ params: eventIdParamsSchema }),
  asyncHandler(finalizeEvent),
)
