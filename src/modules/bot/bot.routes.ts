import { Router } from 'express'
import { validate } from '../../common/middleware/validate.js'
import { asyncHandler } from '../../common/utils/async-handler.js'
import { prisma } from '../../prisma/client.js'
// import { getRules } from '../content/content.controller.js'
import { EventsService } from '../events/events.service.js'
import {
  botEventIdParamsSchema,
  botFeedbackCreateSchema,
  botRegisterSchema,
} from './bot.schemas.js'
import {
  cancelEventRegistration,
  createFeedback,
  registerForEvent,
  registrationCheckEvent,
} from './bot.controller.js'

export const botRouter = Router()
const eventsService = new EventsService(prisma)

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
  validate({ body: botFeedbackCreateSchema }),
  asyncHandler(createFeedback),
)

botRouter.get(
  '/events/:id/registration',
  validate({ query: botEventIdParamsSchema }),
  asyncHandler(registrationCheckEvent),
)

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
