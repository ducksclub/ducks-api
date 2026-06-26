import { env } from './config/env.js'
import { app } from './app.js'
import { prisma } from './prisma/client.js'
import { startJobs } from './jobs/index.js'
import { startWarmupCron } from './modules/warmups/warmup.cron.js'
import { startNotificationQueueCron } from './modules/notifications/notification-queue.cron.js'

const server = app.listen(env.PORT, () => {
  if (env.ENABLE_JOBS) {
    startJobs()
    startWarmupCron(prisma)
    startNotificationQueueCron(prisma)
  }

  console.info(`🦆 [DUCK'S GameClub API] Сервер запущен на порту ${env.PORT}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
