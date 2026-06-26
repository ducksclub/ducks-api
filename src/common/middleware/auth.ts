import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import { forbidden, unauthorized } from '../errors/app-error'
import type { Role } from '../types/domain'
import type { AccessTokenPayload } from '../utils/jwt'
import type { NextFunction, Request, Response } from 'express'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) throw unauthorized('Токен авторизации не передан')

  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload
    next()
  } catch {
    throw unauthorized('Недействительный или просроченный токен')
  }
}

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw unauthorized()
    if (!roles.includes(req.user.role)) throw forbidden()
    next()
  }
