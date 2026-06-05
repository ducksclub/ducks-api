import { startEventReminderJob } from './event-reminders/event-reminder.job'

export function startJobs() {
  startEventReminderJob()
}
