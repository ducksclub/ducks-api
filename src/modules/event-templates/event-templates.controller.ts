import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client'
import { EventTemplatesService } from './event-templates.service'

const service = new EventTemplatesService(prisma)

export const listEventTemplates = async (req: Request, res: Response) => {
  const data = await service.list(req.query as never)
  res.json(data)
}
