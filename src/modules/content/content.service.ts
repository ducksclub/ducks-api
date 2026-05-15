import type { PrismaClient } from '@prisma/client'
import { notFound } from '../../common/errors/app-error.js'
import type { ContentPageKey } from '../../common/types/domain.js'
import type { UpsertContentDto } from './content.schemas.js'

export class ContentService {
  constructor(private readonly prisma: PrismaClient) {}

  async getAll() {
    const content = await this.prisma.contentPage.findMany()
    if (!content) throw notFound('Content page not found')
    return content
  }

  async getById(id: string) {
    const content = await this.prisma.contentPage.findFirst({ where: { id } })
    if (!content) throw notFound('Content page not found')
    return content
  }

  async getByKey(key: ContentPageKey) {
    const contents = await this.prisma.contentPage.findMany({ where: { key } })
    if (!contents.length) throw notFound('Content page not found')
    return contents
  }

  async upsert(id: string, dto: UpsertContentDto) {
    return this.prisma.contentPage.upsert({
      where: { id },
      create: { ...dto },
      update: dto,
    })
  }
}
