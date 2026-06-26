import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'

import { env } from './config/env'
import { corsOptions } from './common/utils/cors'
import { errorHandler } from './common/middleware/error-handler'
import { apiRateLimiter } from './common/middleware/rate-limit'

import { authRouter } from './modules/auth/auth.routes'
import { contentRouter } from './modules/content/content.routes'
import { eventsRouter } from './modules/events/events.routes'
import { feedbackRouter } from './modules/feedback/feedback.routes'
import { ratingsRouter } from './modules/ratings/ratings.routes'
import { usersRouter } from './modules/users/users.routes'
import { uploadRouter } from './modules/upload/upload.routes'
import { contactRouter } from './modules/contact/contact.routes'
import { broadcastRouter } from './modules/broadcasts/broadcast.routes'

export const app = express()

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
)
app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(apiRateLimiter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    etag: false,
  }),
)

app.use('/api/upload', uploadRouter)
app.use('/api/contact', contactRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/events', eventsRouter)
app.use('/api/ratings', ratingsRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/content', contentRouter)
app.use('/api/broadcasts', broadcastRouter)

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Маршрут не найден',
    },
  })
})

app.use(errorHandler)
