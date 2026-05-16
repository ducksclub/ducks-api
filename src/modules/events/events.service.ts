import { Prisma, PrismaClient } from '@prisma/client'
import { badRequest, conflict, notFound } from '../../common/errors/app-error.js'
import { EventStatuses, GameTypes, RegistrationStatuses } from '../../common/types/domain.js'
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

  private readonly seatRevealWindowMs = 15 * 60 * 1000

  async get(params: EventIdParams) {
    const event = await this.prisma.event.findUnique({
      where: { id: params.id },
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

    if (!event) {
      throw notFound('Event not found')
    }

    return this.withPokerSeatLayout(event)
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
                where: { status: RegistrationStatuses.registered },
              },
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ])

    return paginated(events.map((event) => this.withPokerSeatLayout(event)), total, pagination)
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
          status: {
            in: [RegistrationStatuses.registered, RegistrationStatuses.waiting],
          },
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
                  status: RegistrationStatuses.registered,
                },
              },
            },
          },
        },
      }),

      this.prisma.event.count({ where }),
    ])

    return paginated(events.map((event) => this.withPokerSeatLayout(event)), total, pagination)
  }

  async create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        city: dto.city,
        features: dto.features,
        gameRules: dto.gameRules,
        address: dto.address ?? null,
        gameType: dto.gameType,
        startsAt: dto.startsAt,
        endsAt: dto.endsAt ?? null,
        participantLimit: dto.participantLimit,
        seatsPerTable: dto.seatsPerTable,
        pointsForParticipation: dto.pointsForParticipation,
        status: dto.status,
        imageUrl: dto.imageUrl ?? null,
        imageHash: dto.imageHash ?? null,
      },
    })
  }

  async update(id: string, dto: UpdateEventDto) {
    const data: Prisma.EventUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.gameRules !== undefined && { gameRules: dto.gameRules }),
      ...(dto.features !== undefined && { features: dto.features }),
      ...(dto.gameType !== undefined && { gameType: dto.gameType }),
      ...(dto.startsAt !== undefined && { startsAt: dto.startsAt }),
      ...(dto.endsAt !== undefined && { endsAt: dto.endsAt }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.participantLimit !== undefined && {
        participantLimit: dto.participantLimit,
      }),
      ...(dto.seatsPerTable !== undefined && {
        seatsPerTable: dto.seatsPerTable,
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

  private isPokerEvent(gameType: string) {
    return gameType.toLowerCase() === GameTypes.poker
  }

  private getEventStartDateTime(event: { startsAt: Date }) {
    return event.startsAt
  }

  private getSeatAvailableAt(event: { startsAt: Date }) {
    return new Date(this.getEventStartDateTime(event).getTime() - this.seatRevealWindowMs)
  }

  private isSeatVisible(event: { startsAt: Date }) {
    return Date.now() >= this.getSeatAvailableAt(event).getTime()
  }

  private getPokerSeatLayout(totalSeats: number, seatsPerTable: number) {
    if (totalSeats <= 0) {
      throw badRequest('Общее количество мест должно быть положительным числом')
    }

    if (seatsPerTable <= 0) {
      throw badRequest('Количество мест за столом должно быть положительным числом')
    }

    return {
      totalSeats,
      seatsPerTable,
      tableCount: Math.ceil(totalSeats / seatsPerTable),
    }
  }

  private withPokerSeatLayout<T extends { gameType: string; participantLimit: number; seatsPerTable: number }>(
    event: T,
  ) {
    if (!this.isPokerEvent(event.gameType)) return event

    return {
      ...event,
      tableCount: this.getPokerSeatLayout(event.participantLimit, event.seatsPerTable).tableCount,
    }
  }

  private generatePokerSeats(totalSeats: number, seatsPerTable: number) {
    const layout = this.getPokerSeatLayout(totalSeats, seatsPerTable)
    const seats: Array<{ tableNumber: number; seatNumber: number }> = []

    for (let index = 0; index < layout.totalSeats; index += 1) {
      seats.push({
        tableNumber: Math.floor(index / layout.seatsPerTable) + 1,
        seatNumber: (index % layout.seatsPerTable) + 1,
      })
    }

    return seats
  }

  private findFirstAvailablePokerSeat(
    event: { participantLimit: number; seatsPerTable: number },
    registrations: Array<{ tableNumber: number | null; seatNumber: number | null }>,
  ) {
    const occupied = new Set(
      registrations
        .filter(
          (
            registration,
          ): registration is { tableNumber: number; seatNumber: number } =>
            registration.tableNumber !== null && registration.seatNumber !== null,
        )
        .map((registration) => `${registration.tableNumber}:${registration.seatNumber}`),
    )

    for (const seat of this.generatePokerSeats(event.participantLimit, event.seatsPerTable)) {
      if (!occupied.has(`${seat.tableNumber}:${seat.seatNumber}`)) return seat
    }

    return null
  }

  private async getNextPokerSeat(
    tx: Prisma.TransactionClient,
    eventId: string,
    event: { participantLimit: number; seatsPerTable: number },
  ) {
    const occupiedSeats = await tx.eventRegistration.findMany({
      where: {
        eventId,
        status: RegistrationStatuses.registered,
        tableNumber: { not: null },
        seatNumber: { not: null },
      },
      select: {
        tableNumber: true,
        seatNumber: true,
      },
      orderBy: [{ tableNumber: 'asc' }, { seatNumber: 'asc' }],
    })

    return this.findFirstAvailablePokerSeat(event, occupiedSeats)
  }

  private async promoteFirstWaitingPokerRegistration(
    tx: Prisma.TransactionClient,
    eventId: string,
    event: { participantLimit: number; seatsPerTable: number },
    preferredSeat?: { tableNumber: number | null; seatNumber: number | null },
  ) {
    const nextWaiting = await tx.eventRegistration.findFirst({
      where: {
        eventId,
        status: RegistrationStatuses.waiting,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!nextWaiting) return null

    const seat =
      preferredSeat?.tableNumber && preferredSeat.seatNumber
        ? {
            tableNumber: preferredSeat.tableNumber,
            seatNumber: preferredSeat.seatNumber,
          }
        : await this.getNextPokerSeat(tx, eventId, event)

    if (!seat) return null

    return tx.eventRegistration.update({
      where: { id: nextWaiting.id },
      data: {
        status: RegistrationStatuses.registered,
        tableNumber: seat.tableNumber,
        seatNumber: seat.seatNumber,
        cancelledAt: null,
      },
    })
  }

  async registerUser(eventId: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({
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

        if (!event) throw notFound('Event not found')

        if (event.status !== EventStatuses.published) {
          throw badRequest('Registration is available only for published events')
        }

        const isPoker = this.isPokerEvent(event.gameType)

        if (!isPoker && event._count.registrations >= event.participantLimit) {
          throw conflict('Participant limit reached')
        }

        const existing = await tx.eventRegistration.findUnique({
          where: {
            userId_eventId: { userId, eventId },
          },
        })

        if (
          existing &&
          (existing.status === RegistrationStatuses.registered ||
            existing.status === RegistrationStatuses.waiting)
        ) {
          throw conflict('Already registered for this event')
        }

        if (isPoker) {
          const seat = await this.getNextPokerSeat(tx, eventId, event)
          const status = seat ? RegistrationStatuses.registered : RegistrationStatuses.waiting

          const registration = existing
            ? tx.eventRegistration.update({
                where: { id: existing.id },
                data: {
                  status,
                  tableNumber: seat?.tableNumber ?? null,
                  seatNumber: seat?.seatNumber ?? null,
                  cancelledAt: null,
                  createdAt: new Date(),
                },
              })
            : tx.eventRegistration.create({
                data: {
                  userId,
                  eventId,
                  status,
                  tableNumber: seat?.tableNumber ?? null,
                  seatNumber: seat?.seatNumber ?? null,
                },
              })

          const savedRegistration = await registration

          if (status === RegistrationStatuses.waiting) {
            const waitingBefore = await tx.eventRegistration.count({
              where: {
                eventId,
                status: RegistrationStatuses.waiting,
                createdAt: { lt: savedRegistration.createdAt },
              },
            })

            return {
              ...savedRegistration,
              message: 'Основные места заняты. Вы добавлены в список ожидания',
              isWaiting: true,
              waitingPosition: waitingBefore + 1,
            }
          }

          return {
            ...savedRegistration,
            message: 'Вы успешно записаны на игру',
            isWaiting: false,
          }
        }

        const registration = existing
          ? await tx.eventRegistration.update({
              where: { id: existing.id },
              data: {
                status: RegistrationStatuses.registered,
                cancelledAt: null,
                tableNumber: null,
                seatNumber: null,
              },
            })
          : await tx.eventRegistration.create({
              data: {
                userId,
                eventId,
                status: RegistrationStatuses.registered,
                tableNumber: null,
                seatNumber: null,
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('Место уже занято, попробуйте записаться ещё раз')
      }

      throw error
    }
  }

  async cancelRegistration(eventId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      })

      if (!event) throw notFound('Event not found')

      const registration = await tx.eventRegistration.findUnique({
        where: {
          userId_eventId: { userId, eventId },
        },
      })

      if (
        !registration ||
        (registration.status !== RegistrationStatuses.registered &&
          registration.status !== RegistrationStatuses.waiting)
      ) {
        throw notFound('Активная регистрация не найдена')
      }

      const cancelledRegistration = await tx.eventRegistration.update({
        where: { id: registration.id },
        data: {
          status: RegistrationStatuses.cancelled,
          cancelledAt: new Date(),
          tableNumber: null,
          seatNumber: null,
        },
      })

      if (this.isPokerEvent(event.gameType) && registration.status === RegistrationStatuses.registered) {
        await this.promoteFirstWaitingPokerRegistration(
          tx,
          eventId,
          event,
          {
            tableNumber: registration.tableNumber,
            seatNumber: registration.seatNumber,
          },
        )
      }

      return cancelledRegistration
    })
  }

  async getMySeat(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) throw notFound('Event not found')

    if (!this.isPokerEvent(event.gameType)) {
      throw badRequest('Логика мест доступна только для покера')
    }

    const registration = await this.prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    })

    if (
      !registration ||
      (registration.status !== RegistrationStatuses.registered &&
        registration.status !== RegistrationStatuses.waiting)
    ) {
      throw notFound('Регистрация на мероприятие не найдена')
    }

    if (registration.status === RegistrationStatuses.waiting) {
      const waitingBefore = await this.prisma.eventRegistration.count({
        where: {
          eventId,
          status: RegistrationStatuses.waiting,
          createdAt: { lt: registration.createdAt },
        },
      })

      return {
        status: RegistrationStatuses.waiting,
        message: 'Вы в списке ожидания',
        waitingPosition: waitingBefore + 1,
      }
    }

    if (!this.isSeatVisible(event)) {
      return {
        status: 'HIDDEN_UNTIL_15_MIN',
        message: 'Место будет доступно за 15 минут до начала игры',
        availableAt: this.getSeatAvailableAt(event).toISOString(),
      }
    }

    return {
      status: 'SEAT_ASSIGNED',
      message: 'Ваше место назначено',
      tableNumber: registration.tableNumber,
      seatNumber: registration.seatNumber,
    }
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
              where: { status: RegistrationStatuses.registered },
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
        status: RegistrationStatuses.registered,
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
  //         status: RegistrationStatuses.registered,
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
          status: RegistrationStatuses.registered,
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
          where: { status: RegistrationStatuses.registered },
          include: { user: true },
        },
      },
    })
  }
}
