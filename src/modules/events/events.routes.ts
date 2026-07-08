import { Router } from 'express'
import { Roles } from '../../common/types/domain'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/async-handler'
import { authenticate, authorize } from '../../common/middleware/auth'

import {
  createEvent,
  deleteEvent,
  getEvent,
  listActiveEvents,
  listEvents,
  listTemplates,
  listUpcomingEvents,
  updateEvent,
} from './events.controller'

import {
  createEventSchema,
  eventIdParamsSchema,
  eventListQuerySchema,
  updateEventSchema,
} from './events.schemas'

export const eventsRouter = Router()

eventsRouter.get('/', validate({ query: eventListQuerySchema }), asyncHandler(listEvents))

eventsRouter.get('/upcoming', asyncHandler(listUpcomingEvents))
eventsRouter.get('/templates', asyncHandler(listTemplates))

eventsRouter.get(
  '/active-now',
  // authenticate,
  // authorize(Roles.admin),
  asyncHandler(listActiveEvents),
)

eventsRouter.get('/:id', validate({ params: eventIdParamsSchema }), asyncHandler(getEvent))

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
