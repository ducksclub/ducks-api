import type { Request, Response } from 'express'
import { unauthorized } from '../../common/errors/app-error'
import { prisma } from '../../prisma/client'
import { UsersService } from './users.service'

const service = new UsersService(prisma)

export const me = async (req: Request, res: Response) => {
  if (!req.user) throw unauthorized()
  res.json(await service.getProfile(req.user.id))
}

export const update = async (req: Request, res: Response) => {
  if (!req.user) throw unauthorized()
  res.json(await service.updateProfile(req.body, req.user.id))
}

export const getMeByTelegramId = async (req: Request, res: Response) => {
  res.json(await service.getProfileByTelegramId(String(req.params.id)))
}

export async function createUserController(req: Request, res: Response) {
  try {
    const { telegramId, name } = req.body

    if (!telegramId) {
      return res.status(400).json({
        error: 'telegramId is required',
      })
    }

    const user = await service.createUserService({
      telegramId,
      name,
    })

    return res.json(user)
  } catch (error) {
    console.error('CREATE_USER_ERROR:', error)

    return res.status(500).json({
      error: 'Internal server error',
    })
  }
}
