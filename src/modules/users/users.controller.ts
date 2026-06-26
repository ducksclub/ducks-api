import type { Request, Response } from 'express'
import { unauthorized } from '../../common/errors/app-error'
import { prisma } from '../../prisma/client'
import { UsersService } from './users.service'

export class UserController {
  private readonly service = new UsersService(prisma)

  getMe = async (req: Request, res: Response) => {
    if (!req.user) throw unauthorized('Вы не авторизованы')
    const profile = await this.service.getProfile(req.user.id)
    res.json(profile)
  }

  updateProfile = async (req: Request, res: Response) => {
    if (!req.user) throw unauthorized()
    const updatedProfile = await this.service.updateProfile(req.body, req.user.id)
    res.json(updatedProfile)
  }

  getMeByTelegramId = async (req: Request, res: Response) => {
    const profile = await this.service.getProfileByTelegramId(String(req.params.id))
    res.json(profile)
  }
}
