import { Router } from 'express'
import { validate } from '../../common/middleware/validate'
import { authenticate } from '../../common/middleware/auth'
import { asyncHandler } from '../../common/utils/async-handler'

import { listEvents } from './my-events.controller'
import { myEventsQuerySchema } from './my-events.schemas'

export const myEventsRouter = Router()

myEventsRouter.get(
  '/',
  authenticate,
  validate({ query: myEventsQuerySchema }),
  asyncHandler(listEvents),
)
