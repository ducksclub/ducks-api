import { notFound } from '../../../common/errors/app-error.js'
import { paginated } from '../../../common/utils/pagination.js'
import { EventRegistrationsService } from '../registrations/event-registrations.service.js'
import { EventRemindersService } from '../reminders/event-reminders.service.js'
import { EventResultsService } from '../results/event-results.service.js'
import { buildEventListWhere, buildMyEventListWhere } from './events.helper.js'
import {
  mapCreateEventData,
  mapEventReminderResponse,
  mapEventWithPokerSeatLayout,
  mapUpdateEventData,
} from './events.mapper.js'
import { EventsRepository } from './events.repository.js'
import type {
  CreateEventDto,
  EventIdParams,
  EventListQuery,
  EventPrismaClient,
  EventReminderType,
  ReorderParticipantsDto,
  UpdateEventDto,
} from '../events.types.js'
import { PokerSeatsService } from '../poker-seats/poker-seats.service.js'

export class EventsService {
  private readonly repository: EventsRepository
  private readonly pokerSeats = new PokerSeatsService()
  private readonly registrations: EventRegistrationsService
  private readonly results: EventResultsService
  private readonly reminders: EventRemindersService

  constructor(prisma: EventPrismaClient) {
    this.repository = new EventsRepository(prisma)
    this.registrations = new EventRegistrationsService(prisma, this.pokerSeats)
    this.results = new EventResultsService(prisma)
    this.reminders = new EventRemindersService(prisma)
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
    const pagination = {
      page: query.page,
      limit: query.limit,
    }

    const [events, total] = await this.repository.listWithTotal(
      this.repository.findManyWithCounts(where, query),
      this.repository.countMany(where),
    )

    return paginated(
      events.map((event) => mapEventWithPokerSeatLayout(event)),
      total,
      pagination,
    )
  }

  async listTemplates(query: EventListQuery) {
    const where = buildEventListWhere(query, true)
    const pagination = {
      page: query.page,
      limit: query.limit,
    }

    const [events, total] = await this.repository.listWithTotal(
      this.repository.findManyTemplates(where, query),
      this.repository.countMany(where),
    )

    return paginated(events, total, pagination)
  }

  async listMy(query: EventListQuery, userId: string) {
    const where = buildMyEventListWhere(query, userId)
    const pagination = {
      page: query.page,
      limit: query.limit,
    }

    const [events, total] = await this.repository.listWithTotal(
      this.repository.findManyWithCounts(where, query),
      this.repository.countMany(where),
    )

    return paginated(
      events.map((event) => mapEventWithPokerSeatLayout(event)),
      total,
      pagination,
    )
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

  async registerUser(eventId: string, userId: string) {
    return this.registrations.registerUser(eventId, userId)
  }

  async cancelRegistration(eventId: string, userId: string) {
    return this.registrations.cancelRegistration(eventId, userId)
  }

  async getMySeat(eventId: string, userId: string) {
    return this.registrations.getMySeat(eventId, userId)
  }

  async getUserRegistration(userId: string, eventId: string) {
    const userRegistration = await this.registrations.getUserRegistration(userId, eventId)

    if (userRegistration) {
      return userRegistration
    }
    return {
      status: 'CANCELLED',
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

  async getEventParticipants(eventId: string) {
    return this.results.getEventParticipants(eventId)
  }

  async reorderParticipants(eventId: string, dto: ReorderParticipantsDto) {
    return this.results.reorderParticipants(eventId, dto)
  }

  async finalizeEvent(eventId: string) {
    return this.results.finalizeEvent(eventId)
  }

  async getReminders(type: EventReminderType) {
    const events = await this.reminders.getReminders(type)

    return events.map((event) => mapEventReminderResponse(event, type))
  }
}
