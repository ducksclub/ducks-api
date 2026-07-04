import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client'
import { AuthService } from './auth.service'

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

  nicknameAvailability = async (req: Request, res: Response) => {
    const data = await this.service.nicknameAvailability(req.query as { nickname: string })
    res.json(data)
  }

  forgotPassword = async (req: Request, res: Response) => {
    const data = await this.service.forgotPassword(req.body)
    res.json(data)
  }

  resetPassword = async (req: Request, res: Response) => {
    const data = await this.service.resetPassword(req.body)
    res.json(data)
  }

  signInWithTelegram = async (req: Request, res: Response) => {
    const data = await this.service.signInWithTelegram(req.body)
    res.json(data)
  }
}
