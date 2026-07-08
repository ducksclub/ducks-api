import { notFound } from '../../common/errors/app-error'
import { EventsRepository } from './events.repository'
import { buildEventListWhere } from './events.helper'
import { mapEventWithPokerSeatLayout } from '../event-registrations/event-registrations.mapper'
import { mapCreateEventData, mapUpdateEventData } from './events.mapper'
import type {
  CreateEventDto,
  EventIdParams,
  EventListQuery,
  EventPrismaClient,
  UpdateEventDto,
} from './events.types'

export class EventsService {
  private readonly repository: EventsRepository

  constructor(prisma: EventPrismaClient) {
    this.repository = new EventsRepository(prisma)
  }

  async get(params: EventIdParams) {
    const event = await this.repository.findByIdWithCounts(params.id)

    if (!event) {
      throw notFound('Event not found')
    }

    return mapEventWithPokerSeatLayout(event)
  }

  async list(query: EventListQuery) {
    const where = buildEventListWhere(query, false)
    const events = await this.repository.findManyWithCounts(where)
    return events.map((event) => mapEventWithPokerSeatLayout(event))
  }

  async create(dto: CreateEventDto) {
    return this.repository.create(mapCreateEventData(dto))
  }

  async update(id: string, dto: UpdateEventDto) {
    try {
      return await this.repository.update(id, mapUpdateEventData(dto))
    } catch {
      throw notFound('Event not found')
    }
  }

  async delete(id: string) {
    try {
      await this.repository.delete(id)

      return { deleted: true }
    } catch {
      throw notFound('Event not found')
    }
  }

  async listActiveNow() {
    const events = await this.repository.findActiveNow()

    return events.map((event) => mapEventWithPokerSeatLayout(event))
  }

  async listUpcoming() {
    const events = await this.repository.findUpcoming()

    return events.map((event) => mapEventWithPokerSeatLayout(event))
  }

  async listTemplates() {
    const events = await this.repository.findTemplates()

    return events.map((event) => mapEventWithPokerSeatLayout(event))
  }
}
