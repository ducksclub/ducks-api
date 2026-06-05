import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ru'

dayjs.extend(utc)
dayjs.extend(timezone)

export type DateInput = string | number | Date

// форматирует дату и время по времни МСК
export function formatDateTime(input: DateInput): string {
  const date = dayjs(input)

  if (!date.isValid()) {
    return ''
  }

  return date.tz('Europe/Moscow').locale('ru').format('DD.MM.YYYY, HH:mm')
}
