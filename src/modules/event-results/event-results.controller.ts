import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client'
import { EventResultsService } from './event-results.service'

const service = new EventResultsService(prisma)

export const getEventParticipants = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const data = await service.getEventParticipants(id)

  res.json(data)
}

export const reorderParticipants = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const data = await service.reorderParticipants(id, req.body)

  res.json({ data })
}

export const finalizeEvent = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const data = await service.finalizeEvent(id)

  res.json(data)
}
