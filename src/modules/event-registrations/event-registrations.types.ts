export type PokerSeat = {
  tableNumber: number
  seatNumber: number
}

export type PokerSeatLayoutEvent = {
  gameType: string
  participantLimit: number
  seatsPerTable: number
}

export type PreferredSeat = {
  tableNumber: number | null
  seatNumber: number | null
}

export type RegistrationEvent = {
  title: string
  startsAt: Date
  city: string
  address: string
  gameType: string
  participantLimit: number
  seatsPerTable: number
}

export type RegistrationEventWithCount = RegistrationEvent & {
  _count: {
    registrations: number
  }
}
