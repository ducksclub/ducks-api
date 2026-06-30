import { Router } from 'express'
import { authenticate } from '../../common/middleware/auth'
import { asyncHandler } from '../../common/utils/async-handler'
import { UserController } from './users.controller'
import { validate } from '../../common/middleware/validate'
import {
  getProfileByNicknameQuerySchema,
  getProfileByTelegramIdParamsSchema,
  updateProfileSchema,
} from './users.schemas'

export const usersRouter = Router()
export const userController = new UserController()

usersRouter.get('/me', authenticate, asyncHandler(userController.getMe))
usersRouter.patch(
  '/me',
  authenticate,
  validate({ body: updateProfileSchema }),
  asyncHandler(userController.updateProfile),
)
usersRouter.get(
  '/by-telegram-id',
  validate({ query: getProfileByTelegramIdParamsSchema }),
  asyncHandler(userController.getMeByTelegramId),
)
usersRouter.get(
  '/by-nickname',
  authenticate,
  validate({ query: getProfileByNicknameQuerySchema }),
  asyncHandler(userController.getProfileByNickname),
)
