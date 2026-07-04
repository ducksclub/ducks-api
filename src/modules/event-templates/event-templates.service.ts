import { EventTemplatesRepository } from './event-templates.repository'
import type {
  EventTemplateListQuery,
  EventTemplatePrismaClient,
} from './event-templates.types'

export class EventTemplatesService {
  private readonly repository: EventTemplatesRepository

  constructor(prisma: EventTemplatePrismaClient) {
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
