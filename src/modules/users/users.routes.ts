import { Router } from 'express'
import { authenticate } from '../../common/middleware/auth'
import { asyncHandler } from '../../common/utils/async-handler'
import { me } from './users.controller'

export const usersRouter = Router()

usersRouter.get('/me', authenticate, asyncHandler(me))
