import type { Request, Response } from 'express'
import { unauthorized } from '../../common/errors/app-error.js'
import { prisma } from '../../prisma/client.js'
import { EventsService } from './core/events.service.js'
import { EventReminderType } from './events.types.js'

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

export const listTemplates = async (req: Request, res: Response) => {
  const data = await service.listTemplates(req.query as never)
  res.json(data)
}

export const listMyEvents = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw unauthorized()

  const data = await service.listMy(req.query as never, userId)

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

export const registrationCheckEvent = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const id = String(req.params.id)
  if (!userId) throw unauthorized()

  const data = await service.getUserRegistration(userId, id)
  res.json(data)
}

export const registerForEvent = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const id = String(req.params.id)
  if (!userId) throw unauthorized()

  const data = await service.registerUser(id, userId)
  res.status(201).json(data)
}

export const cancelEventRegistration = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const id = String(req.params.id)
  if (!userId) throw unauthorized()

  const data = await service.cancelRegistration(id, userId)
  res.json(data)
}

export const getMyEventSeat = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const id = String(req.params.id)
  if (!userId) throw unauthorized()

  const data = await service.getMySeat(id, userId)
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

export const getReminders = async (req: Request, res: Response) => {
  const type = req.query.type as EventReminderType

  if (!type) {
    return res.status(400).json({
      error: 'type is required (24h | 2h | 10m)',
    })
  }

  const data = await service.getReminders(type)

  res.json(data)
}
