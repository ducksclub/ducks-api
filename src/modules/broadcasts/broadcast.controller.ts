import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client.js'
import type { BroadcastListQuery } from './broadcast.schemas.js'
import { BroadcastService } from './broadcast.service.js'

const broadcastService = new BroadcastService(prisma)

export async function createBroadcast(req: Request, res: Response) {
  const result = await broadcastService.create(req.body)

  res.status(201).json({
    message: 'Рассылка добавлена в очередь',
    data: result,
  })
}

export async function getBroadcasts(req: Request, res: Response) {
  const result = await broadcastService.findAll(req.query as unknown as BroadcastListQuery)

  res.json(result)
}

export async function getBroadcast(req: Request, res: Response) {
  const result = await broadcastService.findById(String(req.params.id))

  res.json({ data: result })
}
