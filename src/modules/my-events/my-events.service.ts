import { PrismaClient } from '@prisma/client'
import { EventsRepository } from '../events/events.repository'
import { EventListQuery } from '../events/events.types'
import { buildMyEventListWhere } from './my-events.helpers'
import { mapEventWithPokerSeatLayout } from '../events/events.mapper'

export class MyEventsService {
  private readonly repository: EventsRepository

  constructor(prisma: PrismaClient) {
    this.repository = new EventsRepository(prisma)
  }

  async list(query: EventListQuery, userId: string) {
    const where = buildMyEventListWhere(query, userId)
    const events = await this.repository.findManyWithCounts(where)

    return events.map((event) => mapEventWithPokerSeatLayout(event))
  }
}
