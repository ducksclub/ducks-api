import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client'
import { AuthService } from './auth.service'
import {
  getTelegramWebAppUserFromInitData,
  parseTelegramWebAppUserFromInitData,
} from './auth.helpers'

export class AuthController {
  private readonly service = new AuthService(prisma)

  signIn = async (req: Request, res: Response) => {
    const data = await this.service.signIn(req.body)
    res.json(data)
  }

  signUp = async (req: Request, res: Response) => {
    const telegramUser = parseTelegramWebAppUserFromInitData(req.body.initData)
    const result = await this.service.signUp(req.body, telegramUser)

    res.status(201).json(result)
  }

  signInWithTelegram = async (req: Request, res: Response) => {
    const telegramUser = getTelegramWebAppUserFromInitData(req.body.initData)
    const sourceCode = req.body.promoCode ?? req.body.sourceCode ?? null
    const data = await this.service.signInWithTelegram(telegramUser, sourceCode)

    res.json(data)
  }
}
