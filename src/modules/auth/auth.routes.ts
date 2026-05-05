import { Router } from 'express'
import { asyncHandler } from '../../common/utils/async-handler.js'
import { validate } from '../../common/middleware/validate.js'
import { loginSchema, registerSchema } from './auth.schemas.js'
import { login, register } from './auth.controller.js'

export const authRouter = Router()

authRouter.post('/register', validate({ body: registerSchema }), asyncHandler(register))
authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(login))
