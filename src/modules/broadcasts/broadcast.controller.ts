import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client.js'
import { BroadcastService } from './broadcast.service.js'

const broadcastService = new BroadcastService(prisma)

export async function createBroadcast(req: Request, res: Response) {
  const result = await broadcastService.create(req.body)

  res.status(201).json({
    message: 'Рассылка добавлена в очередь',
    data: result,
  })
}
