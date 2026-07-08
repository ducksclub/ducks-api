import { Prisma, PrismaClient } from '@prisma/client'

export class MyEventsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(where: Prisma.EventWhereInput) {
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
    })
  }
}
