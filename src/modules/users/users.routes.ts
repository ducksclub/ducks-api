import { Router } from 'express'
import { authenticate } from '../../common/middleware/auth'
import { asyncHandler } from '../../common/utils/async-handler'
import { createUserController, getMeByTelegramId, me } from './users.controller'
import { botAuth } from '../../common/middleware/bot-auth'

export const usersRouter = Router()

usersRouter.get('/me', authenticate, asyncHandler(me))
usersRouter.get('/by-telegram-id/:id', botAuth, asyncHandler(getMeByTelegramId))
usersRouter.post('/', botAuth, asyncHandler(createUserController))
