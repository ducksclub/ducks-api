import { formatDateTime } from '../common/utils/formatDatetime'
import type { RegistrationEvent } from '../modules/events/events.types'

export const createEventRegistrationMessage = (event: RegistrationEvent) => {
  return (
    `✅ Ты записан на "${event.title}"\n` +
    `🕒 Дата и время: ${formatDateTime(event.startsAt)}\n` +
    `💳 Участие: 1000₽ на месте\n` +
    `📍 Адрес: ${event.city}, ${event.address}\n\n` +
    `🔔 Напомню за 24 часа и за 2 часа до начала.\n` +
    `🦆 До встречи в DUCK'S!`
  )
}

export const createEventUnregistrationMessage = (event: RegistrationEvent) => {
  return (
    `❌ Ты отменил запись на "${event.title}"\n` +
    `🕒 Дата и время: ${formatDateTime(event.startsAt)}\n\n` +
    `Твоя запись отменена. Место снова доступно для других участников.\n` +
    `🦆 Будем рады видеть тебя на следующих событиях DUCK'S!`
  )
}
