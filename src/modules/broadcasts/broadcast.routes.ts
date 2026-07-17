import { Router } from 'express'
import { authenticate, authorize } from '../../common/middleware/auth'
import { validate } from '../../common/middleware/validate'
import { Roles } from '../../common/types/domain'
import { asyncHandler } from '../../common/utils/async-handler'
import {
  broadcastIdParamsSchema,
  broadcastListQuerySchema,
  createBroadcastSchema,
} from './broadcast.schemas'
import { createBroadcast, getBroadcast, getBroadcasts } from './broadcast.controller'

export const broadcastRouter = Router()

broadcastRouter.get(
  '/',
  authenticate,
  authorize(Roles.admin),
  validate({ query: broadcastListQuerySchema }),
  asyncHandler(getBroadcasts),
)

broadcastRouter.get(
  '/:id',
  authenticate,
  authorize(Roles.admin),
  validate({ params: broadcastIdParamsSchema }),
  asyncHandler(getBroadcast),
)

broadcastRouter.post(
  '/',
  authenticate,
  authorize(Roles.admin),
  validate({ body: createBroadcastSchema }),
  asyncHandler(createBroadcast),
)
