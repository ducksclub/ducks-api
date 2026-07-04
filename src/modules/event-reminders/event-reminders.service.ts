import { EventRemindersRepository } from './event-reminders.repository'
import { getEventReminderTarget } from './event-reminders.helpers'
import type { ReminderType } from '../../common/types/domain'
import type { EventPrismaClient } from '../events/events.types'

export class EventRemindersService {
  private readonly repository: EventRemindersRepository

  constructor(prisma: EventPrismaClient) {
    this.repository = new EventRemindersRepository(prisma)
  }

  async getReminders(type: ReminderType) {
    const target = getEventReminderTarget(type)

    return this.repository.findPendingReminders(type, target)
  }
}
