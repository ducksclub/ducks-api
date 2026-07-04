import { PrismaClient } from '@prisma/client'
import { EventTemplatesRepository } from './event-templates.repository'
import type { EventTemplateListQuery } from './event-templates.types'

export class EventTemplatesService {
  private readonly repository: EventTemplatesRepository

  constructor(prisma: PrismaClient) {
    this.repository = new EventTemplatesRepository(prisma)
  }

  async list(query: EventTemplateListQuery) {
    const where = {
      isTemplate: true,
      ...(query.gameType && { gameType: query.gameType }),
      ...(query.status && { status: query.status }),
    }

    return this.repository.findMany(where)
  }
}
