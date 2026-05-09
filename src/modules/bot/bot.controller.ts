import type { Request, Response } from 'express'

import { badRequest } from '../../common/errors/app-error.js'

import { prisma } from '../../prisma/client.js'

import { BotEventsService } from './bot.service.js'

const service = new BotEventsService(prisma)

export const registerForEvent = async (req: Request, res: Response) => {
  const eventId = req.body.eventId
  const telegramUserId = req.body.telegramUserId

  if (!eventId) throw badRequest('eventId is required')
  if (!telegramUserId) throw badRequest('telegramUserId is required')

  const registration = await service.registerUser(String(eventId), String(telegramUserId))

  return res.status(201).json({
    success: true,
    data: registration,
  })
}

export const cancelEventRegistration = async (req: Request, res: Response) => {
  const eventId = req.body.eventId
  const telegramUserId = req.body.telegramUserId

  if (!eventId) throw badRequest('eventId is required')
  if (!telegramUserId) throw badRequest('telegramUserId is required')

  const data = await service.cancelRegistration(eventId, telegramUserId)
  res.json(data)
}

export const registrationCheckEvent = async (req: Request, res: Response) => {
  const eventId = req.params.id
  const telegramUserId = req.query.telegramUserId

  if (!eventId) throw badRequest('eventId is required')
  if (!telegramUserId) throw badRequest('telegramUserId is required')

  const data = await service.getUserRegistration(String(telegramUserId), String(eventId))
  res.json(data)
}
