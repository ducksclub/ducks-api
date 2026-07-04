import { Prisma, PrismaClient } from '@prisma/client'

export class EventTemplatesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(where: Prisma.EventWhereInput) {
    return this.prisma.event.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      omit: {
        imageHash: true,
        isTemplate: true,
      },
    })
  }
}
