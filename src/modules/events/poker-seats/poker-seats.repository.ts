import { Prisma } from '@prisma/client'
import { RegistrationStatuses } from '../../../common/types/domain.js'

export class PokerSeatsRepository {
  findOccupiedSeats(tx: Prisma.TransactionClient, eventId: string) {
    return tx.eventRegistration.findMany({
      where: {
        eventId,
        status: RegistrationStatuses.registered,
        tableNumber: { not: null },
        seatNumber: { not: null },
      },
      select: {
        tableNumber: true,
        seatNumber: true,
      },
      orderBy: [{ tableNumber: 'asc' }, { seatNumber: 'asc' }],
    })
  }
}
