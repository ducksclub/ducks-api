import { Prisma, PrismaClient } from '@prisma/client'
import { badRequest, conflict, notFound } from '../../common/errors/app-error.js'
import { EventStatuses, RegistrationStatuses } from '../../common/types/domain.js'
import { getPagination, paginated } from '../../common/utils/pagination.js'
import type {
  CreateEventDto,
  EventIdParams,
  EventListQuery,
  ReorderParticipantsDto,
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

      // await tx.rating.upsert({
      //   where: {
      //     userId_gameType: {
      //       userId,
      //       gameType: event.gameType,
      //     },
      //   },
      //   create: {
      //     userId,
      //     gameType: event.gameType,
      //     points: event.pointsForParticipation,
      //   },
      //   update: {
      //     points: {
      //       increment: event.pointsForParticipation,
      //     },
      //   },
      // })

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

  async listActiveNow() {
    // const now = new Date()

    return this.prisma.event.findMany({
      where: {
        status: EventStatuses.published,
        // startsAt: { lte: now },
        // OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { startsAt: 'desc' },
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
  }

  async getEventParticipants(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) throw notFound('Event not found')

    const participants = await this.prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: RegistrationStatuses.active,
      },
      include: {
        user: true,
      },
      orderBy: {
        position: 'asc',
      },
    })

    return {
      event,
      participants,
    }
  }

  // async reorderParticipants(eventId: string, dto: ReorderParticipantsDto) {
  //   return this.prisma.$transaction(async (tx) => {
  //     const event = await tx.event.findUnique({
  //       where: { id: eventId },
  //     })

  //     if (!event) throw notFound('Event not found')

  //     // обновляем каждого участника
  //     await Promise.all(
  //       dto.participants.map((p) =>
  //         tx.eventRegistration.update({
  //           where: {
  //             userId_eventId: {
  //               userId: p.userId,
  //               eventId,
  //             },
  //           },
  //           data: {
  //             position: p.position,
  //           },
  //         }),
  //       ),
  //     )

  //     // возвращаем обновлённый список
  //     return tx.eventRegistration.findMany({
  //       where: {
  //         eventId,
  //         status: RegistrationStatuses.active,
  //       },
  //       include: {
  //         user: true,
  //       },
  //       orderBy: {
  //         position: 'asc',
  //       },
  //     })
  //   })
  // }

  // =========================
  // 🎯 POSITION POINTS TABLE
  // =========================
  private getBasePoints(position: number): number {
    if (position === 1) return 300
    if (position === 2) return 220
    if (position === 3) return 170
    if (position === 4) return 130
    if (position === 5) return 100
    if (position === 6) return 85
    if (position === 7) return 70
    if (position === 8) return 60
    if (position === 9) return 50
    if (position === 10) return 40
    if (position >= 11 && position <= 15) return 30
    if (position >= 16 && position <= 25) return 20

    return 10 // 26+
  }

  // =========================
  // 📈 MULTIPLIER TABLE
  // =========================
  private getMultiplier(playersCount: number): number {
    if (playersCount <= 20) return 1.0
    if (playersCount <= 35) return 1.2
    if (playersCount <= 50) return 1.5
    if (playersCount <= 65) return 1.8
    if (playersCount <= 80) return 2.0

    return 2.0
  }

  // =========================
  // 🧮 FINAL POINTS CALC
  // =========================
  private calculatePoints(position: number, playersCount: number): number {
    const base = this.getBasePoints(position)
    const multiplier = this.getMultiplier(playersCount)

    return Math.round(base * multiplier)
  }

  async reorderParticipants(eventId: string, dto: ReorderParticipantsDto) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      })

      if (!event) throw notFound('Event not found')

      if (event.status === EventStatuses.completed) {
        throw conflict('Event already completed')
      }

      // update ONLY positions
      await Promise.all(
        dto.participants.map((p) =>
          tx.eventRegistration.update({
            where: {
              userId_eventId: {
                userId: p.userId,
                eventId,
              },
            },
            data: {
              position: p.position,
            },
          }),
        ),
      )

      return tx.eventRegistration.findMany({
        where: { eventId },
        include: { user: true },
        orderBy: { position: 'asc' },
      })
    })
  }

  // =========================
  // 🏁 FINALIZE EVENT
  // =========================
  async finalizeEvent(eventId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      })

      if (!event) throw notFound('Event not found')

      if (event.status === EventStatuses.completed) {
        throw conflict('Event already completed')
      }

      const registrations = await tx.eventRegistration.findMany({
        where: {
          eventId,
          status: RegistrationStatuses.active,
        },
        orderBy: { position: 'asc' },
      })

      const playersCount = registrations.length

      for (const reg of registrations) {
        const points = this.calculatePoints(reg.position ?? playersCount, playersCount)

        await tx.rating.upsert({
          where: {
            userId_gameType: {
              userId: reg.userId,
              gameType: event.gameType,
            },
          },
          create: {
            userId: reg.userId,
            gameType: event.gameType,
            points,
          },
          update: {
            points: {
              increment: points, // 👈 лучше accumulate, а не overwrite
            },
          },
        })
      }

      await tx.event.update({
        where: { id: eventId },
        data: {
          status: EventStatuses.completed,
        },
      })

      return { success: true }
    })
  }

  async getReminders(type: '1h' | '10m') {
    const now = new Date()

    const offset = type === '1h' ? 60 * 60 * 1000 : 10 * 60 * 1000

    const target = new Date(now.getTime() + offset)

    return this.prisma.event.findMany({
      where: {
        status: 'published',
        ...(type === '1h' ? { reminderSent1h: false } : { reminderSent10m: false }),
        startsAt: {
          gte: new Date(target.getTime() - 60 * 1000),
          lte: new Date(target.getTime() + 60 * 1000),
        },
      },
      include: {
        registrations: {
          where: { status: 'active' },
          include: { user: true },
        },
      },
    })
  }
}
