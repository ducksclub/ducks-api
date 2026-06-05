import { env } from './config/env.js'
import { app } from './app.js'
import { prisma } from './prisma/client.js'
import { startJobs } from './jobs/index.js'

const server = app.listen(env.PORT, () => {
  if (env.ENABLE_JOBS) {
    startJobs()
  }

  console.log(`DUCK'S GameClub API is running on port ${env.PORT}`)
})

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
