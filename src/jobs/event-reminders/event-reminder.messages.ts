import { formatDateTime } from '../../common/utils/formatDatetime'
import type { ReminderType } from './event-reminder.config'

type EventReminderMessageData = {
  title: string
  startsAt: Date
  city: string
  address: string
}

export function createEventReminderMessage(event: EventReminderMessageData, type: ReminderType) {
  const titleByType: Record<ReminderType, string> = {
    '24h': '🔔 Напоминание: событие начнётся через 24 часа',
    '2h': '⏰ Напоминание: событие начнётся через 2 часа',
    '15m': '🚀 Напоминание: событие начнётся через 15 минут',
  }

  return (
    `${titleByType[type]}\n\n` +
    `🎲 Событие: "${event.title}"\n` +
    `🕒 Дата и время: ${formatDateTime(event.startsAt)}\n` +
    `📍 Адрес: ${event.city}, ${event.address}\n\n` +
    `🦆 До встречи в DUCK'S!`
  )
}
