import { Request, Response } from 'express'
import { contactSchema } from './contact.schema'
import { ContactService } from './contact.service'

const service = new ContactService()

export const contactController = async (req: Request, res: Response) => {
  const parsed = contactSchema.safeParse(req.body)

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Validation error',
      details: parsed.error.issues,
    })
  }

  await service.sendContactMail(parsed.data)

  return res.json({ success: true })
}
