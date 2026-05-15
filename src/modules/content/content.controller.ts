import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client'
import { ContentService } from './content.service'
import type { ContentPageKey } from '../../common/types/domain.js'
import { badRequest } from '../../common/errors/app-error'

const service = new ContentService(prisma)

export const getContentById = async (req: Request, res: Response) => {
  const contentId = String(req.params.id)
  if (!contentId) badRequest('Content id is required')
  res.json(await service.getById(contentId))
}

export const getContents = async (_req: Request, res: Response) => {
  res.json(await service.getAll())
}

export const getContentByKey = async (req: Request, res: Response) => {
  res.json(await service.getByKey(req.params.key as ContentPageKey))
}

export const upsertContentPage = async (req: Request, res: Response) => {
  res.json(await service.upsert(String(req.params.id), req.body))
}
