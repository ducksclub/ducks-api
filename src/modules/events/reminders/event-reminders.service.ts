import { EventRemindersRepository } from './event-reminders.repository.js'
import { getEventReminderTarget } from '../helpers/event-date.helper.js'
import type { EventPrismaClient, EventReminderType } from '../events.types.js'

export class EventRemindersService {
  private readonly repository: EventRemindersRepository

  constructor(prisma: EventPrismaClient) {
    this.repository = new EventRemindersRepository(prisma)
  }

  async getReminders(type: EventReminderType) {
    const target = getEventReminderTarget(type)

    return this.repository.findPendingReminders(type, target)
  }
}
