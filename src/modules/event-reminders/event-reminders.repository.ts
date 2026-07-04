import { PrismaClient } from '@prisma/client'
import { getEventReminderDateRange, getReminderSentFilter } from './event-reminders.helpers'
import { EventStatuses, RegistrationStatuses, ReminderType } from '../../common/types/domain'

export class EventRemindersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findPendingReminders(type: ReminderType, target: Date) {
    const reminderSentFilter = getReminderSentFilter(type)
    const startsAtRange = getEventReminderDateRange(target)

    return this.prisma.event.findMany({
      where: {
        status: EventStatuses.published,
        startsAt: startsAtRange,
        ...reminderSentFilter,
      },
      include: {
        registrations: {
          where: {
            status: RegistrationStatuses.registered,
          },
          include: {
            user: true,
          },
        },
      },
    })
  }
}
