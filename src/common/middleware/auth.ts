import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { forbidden, unauthorized } from '../errors/app-error.js'
import type { Role } from '../types/domain.js'

export type AuthUser = {
  id: string
  email: string
  role: Role
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) throw unauthorized('Missing bearer token')

  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser
    next()
  } catch {
    throw unauthorized('Invalid or expired token')
  }
}

export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw unauthorized()
    if (!roles.includes(req.user.role)) throw forbidden()
    next()
  }
