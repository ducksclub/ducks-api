import { Prisma, PrismaClient } from '@prisma/client'
import { RegistrationStatuses } from '../../../common/types/domain.js'
import type { PokerSeat } from '../events.types.js'

export class EventRegistrationsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback)
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

  findEvent(tx: Prisma.TransactionClient, eventId: string) {
    return tx.event.findUnique({
      where: { id: eventId },
    })
  }

  findEventOutsideTransaction(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
    })
  }

  findByUserAndEvent(tx: Prisma.TransactionClient, userId: string, eventId: string) {
    return tx.eventRegistration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    })
  }

  findByUserAndEventOutsideTransaction(userId: string, eventId: string) {
    return this.prisma.eventRegistration.findUnique({
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

  countWaitingBefore(tx: Prisma.TransactionClient, eventId: string, createdAt: Date) {
    return tx.eventRegistration.count({
      where: {
        eventId,
        status: RegistrationStatuses.waiting,
        createdAt: { lt: createdAt },
      },
    })
  }

  countWaitingBeforeOutsideTransaction(eventId: string, createdAt: Date) {
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
