import { PrismaClient } from '@prisma/client'
import { MyEventsRepository } from './my-events.repository'
import { buildMyEventListWhere } from './my-events.helpers'
import type { MyEventsQuery } from './my-events.types'

export class MyEventsService {
  private readonly repository: MyEventsRepository

  constructor(prisma: PrismaClient) {
    this.repository = new MyEventsRepository(prisma)
  }

  async list(query: MyEventsQuery, userId: string) {
    const where = buildMyEventListWhere(query, userId)
    const events = await this.repository.findMany(where)

    return events
  }
}
