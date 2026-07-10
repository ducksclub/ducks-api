import type { Request, Response } from 'express'
import { unauthorized } from '../../common/errors/app-error'
import { prisma } from '../../prisma/client'
import { UsersService } from './users.service'
import type {
  GetProfileByIdParamsDto,
  GetProfileByNicknameQueryDto,
  GetProfileByTelegramIdParamsDto,
} from './users.schemas'

export class UserController {
  private readonly service = new UsersService(prisma)

  get = async (_req: Request, res: Response) => {
    const profiles = await this.service.getProfiles()
    res.json(profiles)
  }

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

  getProfileById = async (req: Request, res: Response) => {
    const { id } = req.params as GetProfileByIdParamsDto
    const profile = await this.service.getPublicProfile(id)
    res.json(profile)
  }

  getMeByTelegramId = async (req: Request, res: Response) => {
    const { telegramId } = req.query as GetProfileByTelegramIdParamsDto
    const profile = await this.service.getProfileByTelegramId(telegramId)
    res.json(profile)
  }

  getProfileByNickname = async (req: Request, res: Response) => {
    const { nickname } = req.query as GetProfileByNicknameQueryDto
    const profile = await this.service.getProfileByNickname(nickname)
    res.json(profile)
  }
}
