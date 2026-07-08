import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client.js'
import { EventsService } from './events.service.js'

const service = new EventsService(prisma)

export const getEvent = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const data = await service.get({ id })
  res.json(data)
}

export const listEvents = async (req: Request, res: Response) => {
  const data = await service.list(req.query as never)
  res.json(data)
}

export const createEvent = async (req: Request, res: Response) => {
  const data = await service.create(req.body)
  res.status(201).json(data)
}

export const updateEvent = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const data = await service.update(id, req.body)
  res.json(data)
}

export const deleteEvent = async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const data = await service.delete(id)
  res.json(data)
}

export const listActiveEvents = async (req: Request, res: Response) => {
  const data = await service.listActiveNow()
  res.json({ data })
}

export const listUpcomingEvents = async (req: Request, res: Response) => {
  const data = await service.listUpcoming()
  res.json({ data })
}

export const listTemplates = async (req: Request, res: Response) => {
  const data = await service.listTemplates()
  res.json({ data })
}
