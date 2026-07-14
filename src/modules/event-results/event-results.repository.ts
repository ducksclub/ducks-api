import { Prisma, PrismaClient } from '@prisma/client'
import { EventStatuses, RegistrationStatuses } from '../../common/types/domain.js'

export class EventResultsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback)
  }

  findEvent(eventId: string) {
    return this.prisma.event.findUnique({
      where: {
        id: eventId,
        isTemplate: false,
      },
      omit: {
        isTemplate: true,
      },
    })
  }

  findRegisteredParticipants(eventId: string) {
    return this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: RegistrationStatuses.registered,
      },
      include: {
        user: true,
      },
      orderBy: {
        position: 'asc',
      },
    })
  }

  findEventInTransaction(tx: Prisma.TransactionClient, eventId: string) {
    return tx.event.findUnique({
      where: { id: eventId, isTemplate: false },
      omit: { isTemplate: true },
    })
  }

  updateParticipantPoints(
    tx: Prisma.TransactionClient,
    eventId: string,
    userId: string,
    points: number,
  ) {
    return tx.eventRegistration.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: {
        points,
      },
    })
  }

  findParticipantsByPoints(tx: Prisma.TransactionClient, eventId: string) {
    return tx.eventRegistration.findMany({
      where: {
        eventId,
        status: RegistrationStatuses.registered,
      },
      orderBy: [{ points: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    })
  }

  updateParticipantPosition(
    tx: Prisma.TransactionClient,
    registrationId: string,
    position: number,
  ) {
    return tx.eventRegistration.update({
      where: { id: registrationId },
      data: { position },
    })
  }

  findParticipantsByPosition(tx: Prisma.TransactionClient, eventId: string) {
    return tx.eventRegistration.findMany({
      where: {
        eventId,
        status: RegistrationStatuses.registered,
      },
      include: { user: true },
      orderBy: { position: 'asc' },
    })
  }

  findRegisteredForFinalize(tx: Prisma.TransactionClient, eventId: string) {
    return tx.eventRegistration.findMany({
      where: {
        eventId,
        status: RegistrationStatuses.registered,
      },
      orderBy: { position: 'asc' },
    })
  }

  upsertRating(
    tx: Prisma.TransactionClient,
    params: {
      userId: string
      gameType: string
      points: number
    },
  ) {
    return tx.rating.upsert({
      where: {
        userId_gameType: {
          userId: params.userId,
          gameType: params.gameType,
        },
      },
      create: {
        userId: params.userId,
        gameType: params.gameType,
        points: params.points,
      },
      update: {
        points: {
          increment: params.points,
        },
      },
    })
  }

  markEventCompleted(tx: Prisma.TransactionClient, eventId: string) {
    return tx.event.update({
      where: { id: eventId },
      data: {
        status: EventStatuses.completed,
      },
    })
  }
}
