import cron from 'node-cron'
import { sendEventReminders } from './event-reminder.service'

export function startEventReminderJob() {
  console.info('🔔 [EventReminderJob] Задача напоминаний запущена')

  cron.schedule('* * * * *', async () => {
    try {
      await sendEventReminders()
    } catch (error) {
      console.error('Event reminder job failed:', error)
    }
  })
}
