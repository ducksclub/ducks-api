import type { Request, Response } from 'express'
import type { ContentPageKey } from '../../common/types/domain.js'
import { prisma } from '../../prisma/client.js'
import { ContentService } from './content.service.js'

const service = new ContentService(prisma)

export const getContents = async (req: Request, res: Response) => {
  res.json(await service.getAll())
}

export const upsertContentPage = async (req: Request, res: Response) => {
  res.json(await service.upsert(req.params.key as ContentPageKey, req.body))
}
