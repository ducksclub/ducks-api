import { formatDateTime } from '../../common/utils/formatDatetime'
import type { ReminderType } from './event-reminder.config'

type EventReminderMessageData = {
  title: string
  startsAt: Date
  city: string
  address: string
}

const ADDRESS_2GIS_URL =
  'https://2gis.ru/moscow/geo/4504235316232548?m=37.638322%2C55.800898%2F18.61'

export function createEventReminderMessage(
  event: EventReminderMessageData,
  type: ReminderType,
  userName?: string | null,
) {
  const name = userName ? `${userName}, ` : ''
  const eventFormat = event.title
  const eventTime = formatDateTime(event.startsAt)
  const address = `${event.city}, ${event.address}`

  switch (type) {
    case '24h':
      return (
        `🔔 ${name}завтра у тебя событие в DUCK'S\n\n` +
        `🎲 ${eventFormat}\n` +
        `🕒 Время: ${eventTime}\n\n` +
        `Всё готово — ждём тебя за столом 🦆\n\n` +
        `📍 Адрес: ${address}\n` +
        `💳 Вход: 1000₽ на месте\n\n` +
        `Если вдруг не сможешь прийти — напиши заранее, чтобы мы освободили место для другого игрока.`
      )

    case '2h':
      return (
        `⏰ Через 2 часа начинается ${eventFormat}\n\n` +
        `Уже собираешься? 👀\n\n` +
        `📍 DUCK'S GameClub\n` +
        `🗺 Адрес в 2ГИС: ${ADDRESS_2GIS_URL}\n\n` +
        `До встречи в клубе 🦆`
      )

    case '15m':
      return (
        `🚀 Старт уже через 15 минут\n\n` +
        `🎲 ${eventFormat}\n` +
        `📍 DUCK'S GameClub\n\n` +
        `Если ты уже рядом — заходи, скоро начинаем 🦆`
      )

    default:
      return (
        `🔔 Напоминание о событии\n\n` +
        `🎲 Событие: "${event.title}"\n` +
        `🕒 Дата и время: ${eventTime}\n` +
        `📍 Адрес: ${address}\n\n` +
        `🦆 До встречи в DUCK'S!`
      )
  }
}
