import { Router } from 'express'
import { authenticate, authorize } from '../../common/middleware/auth'
import { asyncHandler } from '../../common/utils/async-handler'
import { UserController } from './users.controller'
import { validate } from '../../common/middleware/validate'
import {
  getProfileByIdParamsSchema,
  getProfileByNicknameQuerySchema,
  getProfileByTelegramIdParamsSchema,
  updateProfileSchema,
  updateUserGameStatsParamsSchema,
  updateUserGameStatsSchema,
} from './users.schemas'
import { Roles } from '../../common/types/domain'

export const usersRouter = Router()
export const userController = new UserController()

usersRouter.get('/', authenticate, authorize(Roles.admin), asyncHandler(userController.get))

usersRouter.patch(
  '/:id/stats/:game',
  authenticate,
  authorize(Roles.admin),
  validate({
    params: updateUserGameStatsParamsSchema,
    body: updateUserGameStatsSchema,
  }),
  asyncHandler(userController.updateGameStats),
)

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
usersRouter.get(
  '/:id',
  authenticate,
  validate({ params: getProfileByIdParamsSchema }),
  asyncHandler(userController.getProfileById),
)
