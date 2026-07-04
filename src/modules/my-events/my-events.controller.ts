import { prisma } from '../../prisma/client'
import { unauthorized } from '../../common/errors/app-error'
import { MyEventsService } from './my-events.service'
import type { Request, Response } from 'express'

const service = new MyEventsService(prisma)

export const listEvents = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw unauthorized()

  const data = await service.list(req.query as never, userId)

  res.json(data)
}
