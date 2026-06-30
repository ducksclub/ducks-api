import jwt from 'jsonwebtoken'
import { env } from '../../config/env'
import type { Role } from '../types/domain'
import type { SignOptions } from 'jsonwebtoken'

export type AccessTokenPayload = {
  id: string
  role: Role
  email: string
  nickname: string
}

export const signAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions)
}
