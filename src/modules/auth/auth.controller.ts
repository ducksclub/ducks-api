import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client'
import { AuthService } from './auth.service'
import { getTelegramWebAppUserFromInitData } from './auth.helpers'

export class AuthController {
  private readonly service = new AuthService(prisma)

  signIn = async (req: Request, res: Response) => {
    const data = await this.service.signIn(req.body)
    res.json(data)
  }

  signUp = async (req: Request, res: Response) => {
    const result = await this.service.signUp(req.body)
    res.status(201).json(result)
  }

  signInWithTelegram = async (req: Request, res: Response) => {
    const telegramUser = getTelegramWebAppUserFromInitData(req.body.initData)
    const data = await this.service.signInWithTelegram(telegramUser)

    res.json(data)
  }
}
