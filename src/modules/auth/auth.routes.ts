import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { AuthController } from './auth.controller'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/async-handler'
import {
  forgotPasswordSchema,
  signInSchema,
  signUpSchema,
  signInWithTelegramSchema,
  nicknameAvailabilitySchema,
  resetPasswordSchema,
} from './auth.schemas'

export const authRouter = Router()
export const controller = new AuthController()
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

authRouter.post('/signin', validate({ body: signInSchema }), asyncHandler(controller.signIn))
authRouter.post('/signup', validate({ body: signUpSchema }), asyncHandler(controller.signUp))
authRouter.post(
  '/forgot-password',
  passwordResetLimiter,
  validate({ body: forgotPasswordSchema }),
  asyncHandler(controller.forgotPassword),
)
authRouter.post(
  '/reset-password',
  passwordResetLimiter,
  validate({ body: resetPasswordSchema }),
  asyncHandler(controller.resetPassword),
)
authRouter.post(
  '/signin-with-telegram',
  validate({ body: signInWithTelegramSchema }),
  asyncHandler(controller.signInWithTelegram),
)
authRouter.get(
  '/nickname/availability',
  validate({ query: nicknameAvailabilitySchema }),
  asyncHandler(controller.nicknameAvailability),
)
