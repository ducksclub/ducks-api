import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client.js'
import { PromoLinkService } from './promo-link.service.js'

const service = new PromoLinkService(prisma)

export const createPromoLink = async (req: Request, res: Response) => {
  res.status(201).json(await service.create(req.body))
}

export const listPromoLinks = async (_req: Request, res: Response) => {
  res.json(await service.list())
}

export const updatePromoLink = async (req: Request, res: Response) => {
  res.json(await service.update(String(req.params.id), req.body))
}

export const trackPromoClick = async (req: Request, res: Response) => {
  res.json(await service.trackClick(req.body))
}

export const telegramStart = async (req: Request, res: Response) => {
  res.json(await service.telegramStart(req.body))
}
