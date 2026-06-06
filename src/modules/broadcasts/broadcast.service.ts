import type { PrismaClient } from '@prisma/client'
import type { CreateBroadcastDto } from './broadcast.schemas.js'
import { NotificationQueueService } from '../notifications/notification-queue.service.js'

export class BroadcastService {
  private readonly notificationQueue: NotificationQueueService

  constructor(private readonly prisma: PrismaClient) {
    this.notificationQueue = new NotificationQueueService(prisma)
  }

  async create(dto: CreateBroadcastDto) {
    const users = await this.prisma.user.findMany({
      where: {
        telegramId: {
          not: null,
        },
      },
      select: {
        id: true,
        telegramId: true,
      },
    })

    let createdCount = 0
    let skippedCount = 0

    for (const user of users) {
      const telegramUserId = Number(user.telegramId)

      if (!telegramUserId) {
        skippedCount++
        continue
      }

      await this.notificationQueue.enqueue({
        userId: user.id,
        telegramUserId,
        type: 'broadcast',
        message: dto.message,
      })

      createdCount++
    }

    return {
      totalUsers: users.length,
      createdCount,
      skippedCount,
    }
  }
}
