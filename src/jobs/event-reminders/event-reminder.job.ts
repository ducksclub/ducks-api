import cron from 'node-cron'
import { sendEventReminders } from './event-reminder.service'

export function startEventReminderJob() {
  console.log('Event reminder job started')

  cron.schedule('* * * * *', async () => {
    try {
      await sendEventReminders()
    } catch (error) {
      console.error('Event reminder job failed:', error)
    }
  })
}
