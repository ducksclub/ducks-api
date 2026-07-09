import { Router } from 'express'
import { authenticate, authorize } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import { Roles } from '../../common/types/domain.js'
import { asyncHandler } from '../../common/utils/async-handler.js'
import { changeClientUi, getClientUi } from './client-ui.controller.js'
import { changeClientUiSchema } from './client-ui.schemas.js'

export const clientUiRouter = Router()

clientUiRouter.get('/', asyncHandler(getClientUi))

clientUiRouter.patch(
  '/',
  authenticate,
  authorize(Roles.admin),
  validate({ body: changeClientUiSchema }),
  asyncHandler(changeClientUi),
)
