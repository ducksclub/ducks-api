import { Router } from 'express'
import { AuthController } from './auth.controller'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/async-handler'
import { signInSchema, signUpSchema, signInWithTelegramSchema } from './auth.schemas'

export const authRouter = Router()
export const controller = new AuthController()

authRouter.post('/signin', validate({ body: signInSchema }), asyncHandler(controller.signIn))
authRouter.post('/signup', validate({ body: signUpSchema }), asyncHandler(controller.signUp))
authRouter.post(
  '/signin-with-telegram',
  validate({ body: signInWithTelegramSchema }),
  asyncHandler(controller.signInWithTelegram),
)
