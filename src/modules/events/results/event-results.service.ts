import { conflict, notFound } from '../../../common/errors/app-error.js'
import { EventStatuses } from '../../../common/types/domain.js'
import { EventResultsRepository } from './event-results.repository.js'
import { calculatePoints } from '../helpers/event-scoring.helper.js'
import type { EventPrismaClient, ReorderParticipantsDto } from '../events.types.js'

export class EventResultsService {
  private readonly repository: EventResultsRepository

  constructor(prisma: EventPrismaClient) {
    this.repository = new EventResultsRepository(prisma)
  }

  async getEventParticipants(eventId: string) {
    const event = await this.repository.findEvent(eventId)

    if (!event) throw notFound('Event not found')

    const participants = await this.repository.findRegisteredParticipants(eventId)

    return {
      event,
      participants,
    }
  }

  async reorderParticipants(eventId: string, dto: ReorderParticipantsDto) {
    return this.repository.transaction(async (tx) => {
      const event = await this.repository.findEventInTransaction(tx, eventId)

      if (!event) throw notFound('Event not found')

      if (event.status === EventStatuses.completed) {
        throw conflict('Event already completed')
      }

      await Promise.all(
        dto.participants.map((participant) =>
          this.repository.updateParticipantPosition(
            tx,
            eventId,
            participant.userId,
            participant.position,
          ),
        ),
      )

      return this.repository.findParticipantsByPosition(tx, eventId)
    })
  }

  async finalizeEvent(eventId: string) {
    return this.repository.transaction(async (tx) => {
      const event = await this.repository.findEventInTransaction(tx, eventId)

      if (!event) throw notFound('Event not found')

      if (event.status === EventStatuses.completed) {
        throw conflict('Event already completed')
      }

      const registrations = await this.repository.findRegisteredForFinalize(tx, eventId)
      const playersCount = registrations.length

      for (const registration of registrations) {
        const points = calculatePoints(registration.position ?? playersCount, playersCount)

        await this.repository.upsertRating(tx, {
          userId: registration.userId,
          gameType: event.gameType,
          points,
        })
      }

      await this.repository.markEventCompleted(tx, eventId)

      return { success: true }
    })
  }
}
