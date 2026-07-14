import { conflict, notFound } from '../../common/errors/app-error.js'
import { EventStatuses } from '../../common/types/domain.js'
import { EventResultsRepository } from './event-results.repository.js'
import type { EventPrismaClient, ReorderParticipantsDto } from '../events/events.types.js'

export class EventResultsService {
  private readonly repository: EventResultsRepository

  constructor(prisma: EventPrismaClient) {
    this.repository = new EventResultsRepository(prisma)
  }

  async getEventParticipants(eventId: string) {
    const event = await this.repository.findEvent(eventId)
    if (!event) throw notFound('Событие не найдено')
    const participants = await this.repository.findRegisteredParticipants(eventId)

    return {
      event,
      participants,
    }
  }

  async reorderParticipants(eventId: string, dto: ReorderParticipantsDto) {
    return this.repository.transaction(async (tx) => {
      const event = await this.repository.findEventInTransaction(tx, eventId)

      if (!event) throw notFound('Событие не найдено')

      if (event.status === EventStatuses.completed) {
        throw conflict('Событие уже завершено')
      }

      await Promise.all(
        dto.participants.map((participant) =>
          this.repository.updateParticipantPoints(
            tx,
            eventId,
            participant.userId,
            participant.points,
          ),
        ),
      )

      const participants = await this.repository.findParticipantsByPoints(tx, eventId)

      await Promise.all(
        participants.map((participant, index) =>
          this.repository.updateParticipantPosition(tx, participant.id, index + 1),
        ),
      )

      return this.repository.findParticipantsByPosition(tx, eventId)
    })
  }

  async finalizeEvent(eventId: string) {
    return this.repository.transaction(async (tx) => {
      const event = await this.repository.findEventInTransaction(tx, eventId)
      if (!event) throw notFound('Событие не найдено')

      if (event.status === EventStatuses.completed) {
        throw conflict('Событие уже завершено')
      }

      const registrations = await this.repository.findRegisteredForFinalize(tx, eventId)

      for (const registration of registrations) {
        await this.repository.upsertRating(tx, {
          userId: registration.userId,
          gameType: event.gameType,
          points: registration.points,
        })
      }

      await this.repository.markEventCompleted(tx, eventId)

      return { success: true }
    })
  }
}
