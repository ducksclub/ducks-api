import cron from 'node-cron'
import type { PrismaClient } from '@prisma/client'
import { NotificationQueueService } from './notification-queue.service.js'

export function startNotificationQueueCron(prisma: PrismaClient) {
  const service = new NotificationQueueService(prisma)

  cron.schedule('* * * * *', async () => {
    try {
      await service.processPending(20)
    } catch (error) {
      console.error('[NotificationQueueCron] Failed to process notifications', error)
    }
  })
}
