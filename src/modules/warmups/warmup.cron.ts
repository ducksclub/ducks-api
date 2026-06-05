import cron from 'node-cron'
import type { PrismaClient } from '@prisma/client'
import { WarmupService } from './warmup.service.js'

export function startWarmupCron(prisma: PrismaClient) {
  const warmupService = new WarmupService(prisma)

  // cron.schedule('*/10 * * * *', async () => {
  cron.schedule('* * * * *', async () => {
    try {
      await warmupService.processDueWarmups()
    } catch (error) {
      console.error('[WarmupCron] Failed to process warmups', error)
    }
  })
}
