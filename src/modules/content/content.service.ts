import type { PrismaClient } from '@prisma/client'
import { notFound } from '../../common/errors/app-error.js'
import type { ContentPageKey } from '../../common/types/domain.js'
import type { UpsertContentDto } from './content.schemas.js'

export class ContentService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll() {
    const page = await this.prisma.contentPage.findMany()
    if (!page) throw notFound('Content page not found')
    return page
  }

  async getByKey(key: ContentPageKey) {
    const page = await this.prisma.contentPage.findUnique({ where: { key } })
    if (!page) throw notFound('Content page not found')
    return page
  }

  async upsert(key: ContentPageKey, dto: UpsertContentDto) {
    return this.prisma.contentPage.upsert({
      where: { key },
      create: { key, ...dto },
      update: dto,
    })
  }
}
