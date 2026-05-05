import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client.js'
import { FeedbackService } from './feedback.service.js'

const service = new FeedbackService(prisma)

export const createFeedback = async (req: Request, res: Response) => {
  res.status(201).json(await service.create(req.body, req.user?.id))
}

export const listFeedback = async (req: Request, res: Response) => {
  res.json(await service.list(req.query as never))
}
