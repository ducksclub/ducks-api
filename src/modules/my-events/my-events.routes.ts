import { Router } from 'express'
import { authenticate } from '../../common/middleware/auth'
import { eventListQuerySchema } from '../events/events.schemas'
import { asyncHandler } from '../../common/utils/async-handler'
import { validate } from '../../common/middleware/validate'
import { listEvents } from './my-events.controller'

export const myEventsRouter = Router()

myEventsRouter.get(
  '/',
  authenticate,
  validate({ query: eventListQuerySchema }),
  asyncHandler(listEvents),
)
