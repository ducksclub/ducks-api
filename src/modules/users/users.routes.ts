import { Router } from 'express'
import { authenticate } from '../../common/middleware/auth'
import { asyncHandler } from '../../common/utils/async-handler'
import { UserController } from './users.controller'

export const usersRouter = Router()
export const userController = new UserController()

usersRouter.get('/me', authenticate, asyncHandler(userController.getMe))
usersRouter.patch('/me', authenticate, asyncHandler(userController.updateProfile))
usersRouter.get('/by-telegram-id/:id', asyncHandler(userController.getMeByTelegramId))
