import { Router } from 'express'
import { validate } from '../../common/middleware/validate.js'
import { asyncHandler } from '../../common/utils/async-handler.js'
import { prisma } from '../../prisma/client.js'
import { getRules } from '../content/content.controller.js'
import { EventsService } from '../events/events.service.js'
import { feedbackCreateSchema } from '../feedback/feedback.schemas.js'
import { FeedbackService } from '../feedback/feedback.service.js'
import { RatingsService } from '../ratings/ratings.service.js'
import { ratingGameParamsSchema, ratingListQuerySchema } from '../ratings/ratings.schemas.js'
import { eventListQuerySchema } from '../events/events.schemas.js'
import { botRegisterSchema } from './bot.schemas.js'

export const botRouter = Router()

const eventsService = new EventsService(prisma)
const ratingsService = new RatingsService(prisma)
const feedbackService = new FeedbackService(prisma)

botRouter.get(
  '/events',
  validate({ query: eventListQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await eventsService.list(req.query as never))
  }),
)

botRouter.post(
  '/register',
  validate({ body: botRegisterSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await eventsService.registerUser(req.body.eventId, req.body.userId))
  }),
)

botRouter.get(
  '/rating/:game',
  validate({ params: ratingGameParamsSchema, query: ratingListQuerySchema }),
  asyncHandler(async (req, res) => {
    res.json(await ratingsService.top(req.params.game as never, req.query as never))
  }),
)

botRouter.get('/rules', asyncHandler(getRules))

botRouter.post(
  '/feedback',
  validate({ body: feedbackCreateSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await feedbackService.create(req.body))
  }),
)
