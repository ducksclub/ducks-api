import {
  findFirstAvailablePokerSeat,
  getSeatAvailableAt,
  isPokerEvent,
  isSeatVisible,
} from './poker-seats.helper.js'
import { mapEventWithPokerSeatLayout } from '../core/events.mapper.js'
import type { EventTransactionClient, PokerSeatLayoutEvent } from '../events.types.js'
import { PokerSeatsRepository } from './poker-seats.repository.js'

export class PokerSeatsService {
  constructor(private readonly repository = new PokerSeatsRepository()) {}

  isPokerEvent(gameType: string) {
    return isPokerEvent(gameType)
  }

  getSeatAvailableAt(event: { startsAt: Date }) {
    return getSeatAvailableAt(event)
  }

  isSeatVisible(event: { startsAt: Date }) {
    return isSeatVisible(event)
  }

  withPokerSeatLayout<T extends PokerSeatLayoutEvent>(event: T) {
    return mapEventWithPokerSeatLayout(event)
  }

  async getNextPokerSeat(
    tx: EventTransactionClient,
    eventId: string,
    event: { participantLimit: number; seatsPerTable: number },
  ) {
    const occupiedSeats = await this.repository.findOccupiedSeats(tx, eventId)

    return findFirstAvailablePokerSeat(event, occupiedSeats)
  }
}
