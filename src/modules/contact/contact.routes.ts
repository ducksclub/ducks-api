import { Router } from 'express'
import { contactController } from './contact.controller'

export const contactRouter = Router()

contactRouter.post('/', contactController)
