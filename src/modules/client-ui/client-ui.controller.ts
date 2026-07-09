import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client.js'
import { ClientUiService } from './client-ui.service.js'
import type { ChangeClientUiDto } from './client-ui.schemas.js'

const service = new ClientUiService(prisma)

export const getClientUi = async (_req: Request, res: Response) => {
  const setting = await service.get()

  res.json({ type: setting.type })
}

export const changeClientUi = async (req: Request, res: Response) => {
  const setting = await service.update(req.body as ChangeClientUiDto)

  res.json({ type: setting.type })
}
