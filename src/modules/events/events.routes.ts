import { Router } from 'express'
import { authenticate, authorize } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import { Roles } from '../../common/types/domain.js'
import { asyncHandler } from '../../common/utils/async-handler.js'

import {
  cancelEventRegistration,
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  listMyEvents,
  registerForEvent,
  registrationCheckEvent,
  updateEvent,
} from './events.controller.js'

import {
  createEventSchema,
  eventIdParamsSchema,
  eventListQuerySchema,
  updateEventSchema,
} from './events.schemas.js'

export const eventsRouter = Router()

// =========================
// PUBLIC
// =========================
eventsRouter.get('/', validate({ query: eventListQuerySchema }), asyncHandler(listEvents))
eventsRouter.get(
  '/me',
  authenticate,
  validate({ query: eventListQuerySchema }),
  asyncHandler(listMyEvents),
)

eventsRouter.get('/:id', validate({ params: eventIdParamsSchema }), asyncHandler(getEvent))

// =========================
// AUTH USER ACTIONS
// =========================

eventsRouter.get(
  '/:id/registration',
  authenticate,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(registrationCheckEvent),
)

eventsRouter.post(
  '/:id/register',
  authenticate,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(registerForEvent),
)

eventsRouter.delete(
  '/:id/register',
  authenticate,
  validate({ params: eventIdParamsSchema }),
  asyncHandler(cancelEventRegistration),
)

// =========================
// ADMIN
// =========================
eventsRouter.post(
  '/',
  authenticate,
  authorize(Roles.admin),
  validate({ body: createEventSchema }),
  asyncHandler(createEvent),
)

eventsRouter.patch(
  '/:id',
  authenticate,
  authorize(Roles.admin),
  validate({
    params: eventIdParamsSchema,
    body: updateEventSchema,
  }),
  asyncHandler(updateEvent),
)

eventsRouter.delete(
  '/:id',
  authenticate,
  authorize(Roles.admin),
  validate({ params: eventIdParamsSchema }),
  asyncHandler(deleteEvent),
)
