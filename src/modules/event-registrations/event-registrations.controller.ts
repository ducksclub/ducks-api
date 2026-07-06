import type { Request, Response } from 'express'
import { unauthorized } from '../../common/errors/app-error'
import { prisma } from '../../prisma/client'
import { EventRegistrationsService } from './event-registrations.service'
import { EventStatuses } from '../../common/types/domain'

const service = new EventRegistrationsService(prisma)

export const checkEvent = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const id = String(req.params.id)
  if (!userId) throw unauthorized()

  const data = await service.getUserRegistration(userId, id)

  res.json(data ?? { status: EventStatuses.cancelled })
}

export const getMyEventSeat = async (req: Request, res: Response) => {
  const userId = req.user?.id
  const id = String(req.params.id)
  if (!userId) throw unauthorized()

  const data = await service.getMyEventSeat(id, userId)
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
