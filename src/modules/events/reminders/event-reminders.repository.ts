import { PrismaClient } from '@prisma/client'
import { getEventReminderDateRange } from '../helpers/event-date.helper'
import { getReminderSentFilter } from '../helpers/event-reminders.helper'
import { EventStatuses, RegistrationStatuses } from '../../../common/types/domain'
import type { EventReminderType } from '../events.types'

export class EventRemindersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findPendingReminders(type: EventReminderType, target: Date) {
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
