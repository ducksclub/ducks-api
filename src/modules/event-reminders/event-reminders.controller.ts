import { prisma } from '../../prisma/client'
import { EventRemindersService } from './event-reminders.service'
import { mapEventReminderResponse } from './event-reminders.mapper'
import type { ReminderType } from '../../common/types/domain'
import type { Request, Response } from 'express'

const service = new EventRemindersService(prisma)

export const getReminders = async (req: Request, res: Response) => {
  const type = req.query.type as ReminderType

  if (!type) {
    return res.status(400).json({
      error: 'type is required (24h | 2h | 15m)',
    })
  }

  const data = await service.getReminders(type)

  res.json(data.map((event) => mapEventReminderResponse(event, type)))
}
