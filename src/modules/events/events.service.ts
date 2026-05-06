import type { Prisma, PrismaClient } from '@prisma/client'
import { badRequest, conflict, notFound } from '../../common/errors/app-error.js'
import { EventStatuses, GameTypes, RegistrationStatuses } from '../../common/types/domain.js'
import { getPagination, paginated } from '../../common/utils/pagination.js'
import type {
  CreateEventDto,
  EventIdParams,
  EventListQuery,
  UpdateEventDto,
} from './events.schemas.js'

export class EventsService {
  constructor(private readonly prisma: PrismaClient) {}

  async get(params: EventIdParams) {
    const where: Prisma.EventWhereInput = {}
    if (params.id) where.id = params.id
    const [event] = await this.prisma.$transaction([
      this.prisma.event.findFirst({
        where,
        orderBy: { startsAt: 'asc' },
        include: {
          _count: { select: { registrations: { where: { status: RegistrationStatuses.active } } } },
        },
      }),
      this.prisma.event.count({ where }),
    ])
    return event
  }

  async list(query: EventListQuery) {
    const where: Prisma.EventWhereInput = {}
    if (query.gameType) where.gameType = query.gameType
    if (query.status) where.status = query.status
    const pagination = { page: query.page, limit: query.limit }
    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        ...getPagination(pagination),
        orderBy: { startsAt: 'asc' },
        include: {
          _count: { select: { registrations: { where: { status: RegistrationStatuses.active } } } },
        },
      }),
      this.prisma.event.count({ where }),
    ])
    return paginated(events, total, pagination)
  }

  async create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        address: dto.address ?? null,
        gameType: dto.gameType,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt ?? null,
        location: dto.location ?? null,
        participantLimit: dto.participantLimit,
        pointsForParticipation: dto.pointsForParticipation,
        status: dto.status,
        imageUrl: dto.imageUrl ?? null,
        imageHash: dto.imageHash ?? null,
      },
    })
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.ensureEvent(id)
    const data: Prisma.EventUpdateInput = {}
    if (dto.address !== undefined) data.address = dto.address
    if (dto.gameType !== undefined) data.gameType = dto.gameType
    if (dto.startsAt !== undefined) data.startsAt = dto.startsAt
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt
    if (dto.location !== undefined) data.location = dto.location
    if (dto.participantLimit !== undefined) data.participantLimit = dto.participantLimit
    if (dto.pointsForParticipation !== undefined)
      data.pointsForParticipation = dto.pointsForParticipation
    if (dto.status !== undefined) data.status = dto.status
    if (dto.imageHash !== undefined) data.imageHash = dto.imageHash
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl
    return this.prisma.event.update({ where: { id }, data })
  }

  async delete(id: string) {
    await this.ensureEvent(id)
    await this.prisma.event.delete({ where: { id } })
    return { deleted: true }
  }

  async registerUser(eventId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          _count: { select: { registrations: { where: { status: RegistrationStatuses.active } } } },
        },
      })
      if (!event) throw notFound('Event not found')
      if (event.status !== EventStatuses.published)
        throw badRequest('Registration is available only for published events')
      if (event._count.registrations >= event.participantLimit)
        throw conflict('Participant limit reached')

      const existing = await tx.eventRegistration.findUnique({
        where: { userId_eventId: { userId, eventId } },
      })
      if (existing?.status === RegistrationStatuses.active)
        throw conflict('User is already registered for this event')

      const registration = existing
        ? await tx.eventRegistration.update({
            where: { id: existing.id },
            data: { status: RegistrationStatuses.active, cancelledAt: null },
          })
        : await tx.eventRegistration.create({ data: { eventId, userId } })

      await tx.rating.upsert({
        where: { userId_gameType: { userId, gameType: event.gameType } },
        create: { userId, gameType: event.gameType, points: event.pointsForParticipation },
        update: { points: { increment: event.pointsForParticipation } },
      })

      return registration
    })
  }

  async cancelRegistration(eventId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    })
    if (!registration || registration.status !== RegistrationStatuses.active)
      throw notFound('Active registration not found')

    return this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatuses.cancelled, cancelledAt: new Date() },
    })
  }

  async addParticipant(eventId: string, userId: string) {
    return this.registerUser(eventId, userId)
  }

  async removeParticipant(eventId: string, userId: string) {
    return this.cancelRegistration(eventId, userId)
  }

  private async ensureEvent(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } })
    if (!event) throw notFound('Event not found')
    return event
  }
}

export const gameTypes = [GameTypes.poker, GameTypes.darts, GameTypes.billiards] as const
