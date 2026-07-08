import { Prisma, PrismaClient } from '@prisma/client'
import { EventStatuses, RegistrationStatuses } from '../../common/types/domain.js'

const registeredCountInclude = Prisma.validator<Prisma.EventInclude>()({
  _count: {
    select: {
      registrations: {
        where: { status: RegistrationStatuses.registered },
      },
    },
  },
})

export class EventsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
    })
  }

  findByIdWithCounts(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: registeredCountInclude,
    })
  }

  findByIdWithRegisteredCount(id: string) {
    return this.findByIdWithCounts(id)
  }

  findManyWithCounts(where: Prisma.EventWhereInput) {
    return this.prisma.event.findMany({
      where: {
        ...where,
        isTemplate: false,
      },
      orderBy: { startsAt: 'asc' },
      omit: {
        imageHash: true,
        isTemplate: true,
      },
      include: registeredCountInclude,
    })
  }

  create(data: Prisma.EventCreateInput) {
    return this.prisma.event.create({ data })
  }

  update(id: string, data: Prisma.EventUpdateInput) {
    return this.prisma.event.update({
      where: { id },
      data,
    })
  }

  delete(id: string) {
    return this.prisma.event.delete({
      where: { id },
    })
  }

  findActiveNow() {
    return this.prisma.event.findMany({
      where: {
        isTemplate: false,
        status: EventStatuses.published,
        endsAt: null,
        startsAt: {
          lte: new Date(),
        },
      },
      orderBy: { startsAt: 'desc' },
      include: registeredCountInclude,
      omit: {
        isTemplate: true,
      },
    })
  }

  findUpcoming() {
    return this.prisma.event.findMany({
      where: {
        isTemplate: false,
        status: EventStatuses.published,
        startsAt: {
          gte: new Date(),
        },
      },
      orderBy: { startsAt: 'asc' },
      include: registeredCountInclude,
      omit: {
        isTemplate: true,
      },
    })
  }
}
