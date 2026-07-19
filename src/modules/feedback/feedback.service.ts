import type { PrismaClient } from '@prisma/client'
import type { FeedbackCreateDto } from './feedback.schemas'

export class FeedbackService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: FeedbackCreateDto, userId: string) {
    return this.prisma.feedback.create({
      data: {
        message: dto.message,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
      },
    })
  }

  async list() {
    const feedbacks = await this.prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, nickname: true } } },
    })
    return feedbacks
  }

  async delete(id: string) {
    await this.prisma.feedback.delete({
      where: { id },
    })

    return {
      deleted: true,
    }
  }
}
