import { badRequest } from '../../../common/errors/app-error.js'
import { GameTypes } from '../../../common/types/domain.js'
import { EVENT_SEAT_REVEAL_WINDOW_MS } from '../events.constants.js'
import type { PokerSeat } from '../events.types.js'

export function isPokerEvent(gameType: string) {
  return gameType.toLowerCase() === GameTypes.poker
}

export function getSeatAvailableAt(event: { startsAt: Date }) {
  return new Date(event.startsAt.getTime() - EVENT_SEAT_REVEAL_WINDOW_MS)
}

export function isSeatVisible(event: { startsAt: Date }) {
  return Date.now() >= getSeatAvailableAt(event).getTime()
}

export function getPokerSeatLayout(totalSeats: number, seatsPerTable: number) {
  if (totalSeats <= 0) {
    throw badRequest('Общее количество мест должно быть положительным числом')
  }

  if (seatsPerTable <= 0) {
    throw badRequest('Количество мест за столом должно быть положительным числом')
  }

  return {
    totalSeats,
    seatsPerTable,
    tableCount: Math.ceil(totalSeats / seatsPerTable),
  }
}

export function generatePokerSeats(totalSeats: number, seatsPerTable: number) {
  const layout = getPokerSeatLayout(totalSeats, seatsPerTable)
  const seats: PokerSeat[] = []

  for (let index = 0; index < layout.totalSeats; index += 1) {
    seats.push({
      tableNumber: Math.floor(index / layout.seatsPerTable) + 1,
      seatNumber: (index % layout.seatsPerTable) + 1,
    })
  }

  return seats
}

export function findFirstAvailablePokerSeat(
  event: { participantLimit: number; seatsPerTable: number },
  registrations: Array<{ tableNumber: number | null; seatNumber: number | null }>,
) {
  const occupied = new Set(
    registrations
      .filter(
        (registration): registration is PokerSeat =>
          registration.tableNumber !== null && registration.seatNumber !== null,
      )
      .map((registration) => `${registration.tableNumber}:${registration.seatNumber}`),
  )

  for (const seat of generatePokerSeats(event.participantLimit, event.seatsPerTable)) {
    if (!occupied.has(`${seat.tableNumber}:${seat.seatNumber}`)) return seat
  }

  return null
}
