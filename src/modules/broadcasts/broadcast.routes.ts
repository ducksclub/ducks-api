import { Router } from 'express'
import { authenticate, authorize } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import { Roles } from '../../common/types/domain.js'
import { asyncHandler } from '../../common/utils/async-handler.js'
import { createBroadcastSchema } from './broadcast.schemas.js'
import { createBroadcast } from './broadcast.controller.js'

export const broadcastRouter = Router()

broadcastRouter.post(
  '/',
  authenticate,
  authorize(Roles.admin),
  validate({ body: createBroadcastSchema }),
  asyncHandler(createBroadcast),
)
