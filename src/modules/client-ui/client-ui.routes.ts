import { Router } from 'express'
import { authenticate, authorize } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import { Roles } from '../../common/types/domain.js'
import { asyncHandler } from '../../common/utils/async-handler.js'
import {
  changeClientUi,
  getClientUi,
  getMyClientUiRegistration,
  listClientUiRegistrations,
  registerForClientUi,
  unregisterFromClientUi,
} from './client-ui.controller.js'
import {
  changeClientUiSchema,
  clientUiRegistrationQuerySchema,
  createClientUiRegistrationSchema,
} from './client-ui.schemas.js'

export const clientUiRouter = Router()

clientUiRouter.get('/', asyncHandler(getClientUi))

clientUiRouter.get(
  '/registrations',
  authenticate,
  authorize(Roles.admin),
  validate({ query: clientUiRegistrationQuerySchema }),
  asyncHandler(listClientUiRegistrations),
)

clientUiRouter.get(
  '/registrations/me',
  authenticate,
  validate({ query: clientUiRegistrationQuerySchema }),
  asyncHandler(getMyClientUiRegistration),
)

clientUiRouter.post(
  '/registrations',
  authenticate,
  validate({ body: createClientUiRegistrationSchema }),
  asyncHandler(registerForClientUi),
)

clientUiRouter.delete(
  '/registrations',
  authenticate,
  validate({ body: createClientUiRegistrationSchema }),
  asyncHandler(unregisterFromClientUi),
)

clientUiRouter.patch(
  '/',
  authenticate,
  authorize(Roles.admin),
  validate({ body: changeClientUiSchema }),
  asyncHandler(changeClientUi),
)
