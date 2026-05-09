import { Request, Response, NextFunction } from 'express'
import { unauthorized } from '../errors/app-error'

export const botAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (token !== process.env.BOT_API_KEY) throw unauthorized('Bot is not authorized')
  ;(req as any).isBot = true
  next()
}
