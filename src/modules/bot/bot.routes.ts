import { Router } from 'express'
import { validate } from '../../common/middleware/validate.js'
import { asyncHandler } from '../../common/utils/async-handler.js'
import { prisma } from '../../prisma/client.js'
// import { getRules } from '../content/content.controller.js'
import { EventsService } from '../events/events.service.js'
import { feedbackCreateSchema } from '../feedback/feedback.schemas.js'
import { FeedbackService } from '../feedback/feedback.service.js'
import { botRegisterSchema } from './bot.schemas.js'
import { cancelEventRegistration, registerForEvent } from './bot.controller.js'

export const botRouter = Router()

const eventsService = new EventsService(prisma)
const feedbackService = new FeedbackService(prisma)

botRouter.post(
  '/register',
  validate({ body: botRegisterSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await eventsService.registerUser(req.body.eventId, req.body.userId))
  }),
)

// botRouter.get('/rules', asyncHandler(getRules))

botRouter.post(
  '/feedback',
  validate({ body: feedbackCreateSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await feedbackService.create(req.body))
  }),
)

// eventsRouter.get(
//   '/:id/registration',
//   authenticate,
//   validate({ params: eventIdParamsSchema }),
//   asyncHandler(registrationCheckEvent),
// )

botRouter.post(
  '/events/:id/register',
  validate({ body: botRegisterSchema }),
  asyncHandler(registerForEvent),
)

botRouter.delete(
  '/events/:id/register',
  validate({ body: botRegisterSchema }),
  asyncHandler(cancelEventRegistration),
)
