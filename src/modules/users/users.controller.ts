import type { Request, Response } from 'express'
import { unauthorized } from '../../common/errors/app-error'
import { prisma } from '../../prisma/client'
import { UsersService } from './users.service'

const service = new UsersService(prisma)

export const me = async (req: Request, res: Response) => {
  if (!req.user) throw unauthorized()
  res.json(await service.getProfile(req.user.id))
}
