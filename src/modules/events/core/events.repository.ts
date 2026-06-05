import { Prisma, PrismaClient } from '@prisma/client'
import { EventStatuses, RegistrationStatuses } from '../../../common/types/domain.js'
import { getPagination } from '../../../common/utils/pagination.js'
import type { EventListQuery } from '../events.types.js'

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

  findManyWithCounts(where: Prisma.EventWhereInput, pagination: EventListQuery) {
    return this.prisma.event.findMany({
      where,
      ...getPagination(pagination),
      orderBy: { startsAt: 'asc' },
      include: registeredCountInclude,
    })
  }

  findManyTemplates(where: Prisma.EventWhereInput, pagination: EventListQuery) {
    return this.prisma.event.findMany({
      where,
      ...getPagination(pagination),
      orderBy: { startsAt: 'asc' },
    })
  }

  countMany(where: Prisma.EventWhereInput) {
    return this.prisma.event.count({ where })
  }

  listWithTotal<T>(
    eventsQuery: Prisma.PrismaPromise<T[]>,
    totalQuery: Prisma.PrismaPromise<number>,
  ) {
    return this.prisma.$transaction([eventsQuery, totalQuery])
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
        status: EventStatuses.published,
        endsAt: null,
        startsAt: {
          lt: new Date(),
        },
      },
      orderBy: { startsAt: 'desc' },
      include: registeredCountInclude,
    })
  }
}
