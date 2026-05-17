import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler } from './common/middleware/error-handler.js'
import { apiRateLimiter } from './common/middleware/rate-limit.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { botRouter } from './modules/bot/bot.routes.js'
import { contentRouter } from './modules/content/content.routes.js'
import { eventsRouter } from './modules/events/events.routes.js'
import { feedbackRouter } from './modules/feedback/feedback.routes.js'
import { ratingsRouter } from './modules/ratings/ratings.routes.js'
import { usersRouter } from './modules/users/users.routes.js'
import { uploadRouter } from './modules/upload/upload.routes.js'
import { contactRouter } from './modules/contact/contact.routes.js'
import {
  adminPromoLinksRouter,
  publicPromoLinksRouter,
} from './modules/promo-links/promo-link.routes.js'
import path from 'path'

export const app = express()

// app.use(helmet())
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN }))
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(apiRateLimiter)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
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
app.use('/api/bot', botRouter)
app.use('/api/admin/promo-links', adminPromoLinksRouter)
app.use('/api/promo-links', publicPromoLinksRouter)

app.use('/admin/promo-links', adminPromoLinksRouter)
app.use('/promo-links', publicPromoLinksRouter)

app.use((_req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }),
)
app.use(errorHandler)
