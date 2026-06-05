import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ru'

import { prisma } from '../../prisma/client'
import { sendEventNotification } from '../../modules/telegram-bot/telegram-bot.api'
import { EVENT_REMINDERS, type ReminderConfig } from './event-reminder.config'
import { createEventReminderMessage } from './event-reminder.messages'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('ru')

export async function sendEventReminders() {
  for (const reminder of EVENT_REMINDERS) {
    await sendReminderByConfig(reminder)
  }
}

async function sendReminderByConfig(reminder: ReminderConfig) {
  const now = dayjs().tz('Europe/Moscow')
  const reminderStart = now.add(reminder.amount, reminder.unit).subtract(1, 'minute').toDate()
  const reminderEnd = now.add(reminder.amount, reminder.unit).add(1, 'minute').toDate()

  const events = await prisma.event.findMany({
    where: {
      status: 'published',
      [reminder.sentField]: false,
      startsAt: {
        gte: reminderStart,
        lte: reminderEnd,
      },
    },
    include: {
      registrations: {
        where: {
          status: 'registered',
        },
        include: {
          user: true,
        },
      },
    },
  })

  console.log('Reminder job check:', {
    type: reminder.type,
    now: now.format('YYYY-MM-DD HH:mm:ss'),
    reminderStart,
    reminderEnd,
    eventsCount: events.length,
  })

  for (const event of events) {
    await sendReminderToEventParticipants(event, reminder)

    await prisma.event.update({
      where: { id: event.id },
      data: {
        [reminder.sentField]: true,
      },
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendReminderToEventParticipants(event: any, reminder: ReminderConfig) {
  for (const registration of event.registrations) {
    const telegramId = registration.user.telegramId

    if (!telegramId) continue

    try {
      await sendEventNotification({
        telegramUserId: Number(telegramId),
        message: createEventReminderMessage(event, reminder.type),
      })
    } catch (error) {
      console.error('Failed to send event reminder:', {
        reminderType: reminder.type,
        eventId: event.id,
        userId: registration.user.id,
        telegramId,
        error,
      })
    }
  }
}
