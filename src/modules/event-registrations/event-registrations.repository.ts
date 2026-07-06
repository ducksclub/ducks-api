import { Prisma, PrismaClient } from '@prisma/client'
import { RegistrationStatuses } from '../../common/types/domain'
import type { PokerSeat } from './event-registrations.types'

export class EventRegistrationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findUserRegistration(userId: string, eventId: string) {
    return this.prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    })
  }

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

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback)
  }

  findEvent(eventId: string): ReturnType<PrismaClient['event']['findUnique']>

  findEvent(
    tx: Prisma.TransactionClient,
    eventId: string,
  ): ReturnType<Prisma.TransactionClient['event']['findUnique']>
  findEvent(arg1: string | Prisma.TransactionClient, arg2?: string) {
    if (typeof arg1 !== 'string') {
      if (!arg2) throw new Error('eventId is required')

      return arg1.event.findUnique({
        where: { id: arg2 },
      })
    }

    return this.prisma.event.findUnique({
      where: { id: arg1 },
    })
  }

  findEventForRegistration(tx: Prisma.TransactionClient, eventId: string) {
    return tx.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: RegistrationStatuses.registered },
            },
          },
        },
      },
    })
  }

  findByUserAndEvent(tx: Prisma.TransactionClient, userId: string, eventId: string) {
    return tx.eventRegistration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    })
  }

  findUserTelegramId(tx: Prisma.TransactionClient, userId: string) {
    return tx.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    })
  }

  createRegistration(
    tx: Prisma.TransactionClient,
    data: {
      userId: string
      eventId: string
      status: string
      tableNumber: number | null
      seatNumber: number | null
    },
  ) {
    return tx.eventRegistration.create({ data })
  }

  reactivateRegistration(
    tx: Prisma.TransactionClient,
    id: string,
    data: {
      status: string
      tableNumber: number | null
      seatNumber: number | null
    },
  ) {
    return tx.eventRegistration.update({
      where: { id },
      data: {
        ...data,
        cancelledAt: null,
        createdAt: new Date(),
      },
    })
  }

  cancelRegistration(tx: Prisma.TransactionClient, id: string) {
    return tx.eventRegistration.update({
      where: { id },
      data: {
        status: RegistrationStatuses.cancelled,
        cancelledAt: new Date(),
        tableNumber: null,
        seatNumber: null,
      },
    })
  }

  findNextWaitingRegistration(tx: Prisma.TransactionClient, eventId: string) {
    return tx.eventRegistration.findFirst({
      where: {
        eventId,
        status: RegistrationStatuses.waiting,
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  promoteWaitingRegistration(tx: Prisma.TransactionClient, id: string, seat: PokerSeat | null) {
    return tx.eventRegistration.update({
      where: { id },
      data: {
        status: RegistrationStatuses.registered,
        tableNumber: seat?.tableNumber ?? null,
        seatNumber: seat?.seatNumber ?? null,
        cancelledAt: null,
      },
    })
  }

  countWaitingBefore(eventId: string, createdAt: Date) {
    return this.prisma.eventRegistration.count({
      where: {
        eventId,
        status: RegistrationStatuses.waiting,
        createdAt: { lt: createdAt },
      },
    })
  }

  isUniqueConstraintError(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  }
}
