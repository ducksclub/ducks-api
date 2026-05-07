import { Prisma, PrismaClient } from '@prisma/client'
import { badRequest, conflict, notFound } from '../../common/errors/app-error.js'
import { EventStatuses, RegistrationStatuses } from '../../common/types/domain.js'
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
    const event = await this.prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: RegistrationStatuses.active },
            },
          },
        },
      },
    })

    if (!event) {
      throw notFound('Event not found')
    }

    return event
  }

  async list(query: EventListQuery) {
    const where: Prisma.EventWhereInput = {}

    if (query.gameType) where.gameType = query.gameType
    if (query.status) where.status = query.status

    const pagination = {
      page: query.page,
      limit: query.limit,
    }

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        ...getPagination(pagination),
        orderBy: { startsAt: 'asc' },
        include: {
          _count: {
            select: {
              registrations: {
                where: { status: RegistrationStatuses.active },
              },
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ])

    return paginated(events, total, pagination)
  }

  async listMy(query: EventListQuery, userId: string) {
    const where: Prisma.EventWhereInput = {
      ...(query.gameType && {
        gameType: query.gameType,
      }),

      ...(query.status && {
        status: query.status,
      }),

      registrations: {
        some: {
          userId,
          status: RegistrationStatuses.active,
        },
      },
    }

    const pagination = {
      page: query.page,
      limit: query.limit,
    }

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,

        ...getPagination(pagination),

        orderBy: {
          startsAt: 'asc',
        },

        include: {
          _count: {
            select: {
              registrations: {
                where: {
                  status: RegistrationStatuses.active,
                },
              },
            },
          },
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
    const data: Prisma.EventUpdateInput = {
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.gameType !== undefined && { gameType: dto.gameType }),
      ...(dto.startsAt !== undefined && { startsAt: dto.startsAt }),
      ...(dto.endsAt !== undefined && { endsAt: dto.endsAt }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.participantLimit !== undefined && {
        participantLimit: dto.participantLimit,
      }),
      ...(dto.pointsForParticipation !== undefined && {
        pointsForParticipation: dto.pointsForParticipation,
      }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.imageHash !== undefined && { imageHash: dto.imageHash }),
    }

    try {
      return await this.prisma.event.update({
        where: { id },
        data,
      })
    } catch {
      throw notFound('Event not found')
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.event.delete({
        where: { id },
      })

      return { deleted: true }
    } catch {
      throw notFound('Event not found')
    }
  }

  async registerUser(eventId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: {
              registrations: {
                where: { status: RegistrationStatuses.active },
              },
            },
          },
        },
      })

      if (!event) throw notFound('Event not found')

      if (event.status !== EventStatuses.published) {
        throw badRequest('Registration is available only for published events')
      }

      if (event._count.registrations >= event.participantLimit) {
        throw conflict('Participant limit reached')
      }

      const existing = await tx.eventRegistration.findUnique({
        where: {
          userId_eventId: { userId, eventId },
        },
      })

      if (existing && existing.status === RegistrationStatuses.active) {
        throw conflict('Already registered for this event')
      }

      const registration = existing
        ? await tx.eventRegistration.update({
            where: { id: existing.id },
            data: {
              status: RegistrationStatuses.active,
              cancelledAt: null,
            },
          })
        : await tx.eventRegistration.create({
            data: {
              userId,
              eventId,
              status: RegistrationStatuses.active,
            },
          })

      await tx.rating.upsert({
        where: {
          userId_gameType: {
            userId,
            gameType: event.gameType,
          },
        },
        create: {
          userId,
          gameType: event.gameType,
          points: event.pointsForParticipation,
        },
        update: {
          points: {
            increment: event.pointsForParticipation,
          },
        },
      })

      return registration
    })
  }

  async cancelRegistration(eventId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    })

    if (!registration || registration.status !== RegistrationStatuses.active) {
      throw notFound('Active registration not found')
    }

    return this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: RegistrationStatuses.cancelled,
        cancelledAt: new Date(),
      },
    })
  }

  async getUserRegistration(userId: string, eventId: string) {
    return this.prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    })
  }
}
