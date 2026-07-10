import type { Request, Response } from 'express'
import { unauthorized } from '../../common/errors/app-error.js'
import { prisma } from '../../prisma/client.js'
import { sendEventNotification } from '../telegram-bot/telegram-bot.api.js'
import { ClientUiService } from './client-ui.service.js'
import type {
  ChangeClientUiDto,
  ClientUiRegistrationQueryDto,
  CreateClientUiRegistrationDto,
} from './client-ui.schemas.js'

const service = new ClientUiService(prisma)

export const getClientUi = async (_req: Request, res: Response) => {
  const setting = await service.get()

  res.json({ type: setting.type })
}

export const changeClientUi = async (req: Request, res: Response) => {
  const setting = await service.update(req.body as ChangeClientUiDto)

  res.json({ type: setting.type })
}

export const listClientUiRegistrations = async (req: Request, res: Response) => {
  const { type } = req.query as ClientUiRegistrationQueryDto
  const registrations = await service.listRegistrations(type)

  res.json({ type, registrations })
}

export const getMyClientUiRegistration = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw unauthorized()

  const { type } = req.query as ClientUiRegistrationQueryDto
  const registration = await service.getUserRegistration(type, userId)

  res.json({ type, registration })
}

export const registerForClientUi = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw unauthorized()

  const data = await service.register(req.body as CreateClientUiRegistrationDto, userId)

  if (data.isNewRegistration) {
    const user = await service.getUserTelegramId(userId)
    const telegramUserId = user?.telegramId ? Number(user.telegramId) : null

    if (telegramUserId && Number.isFinite(telegramUserId)) {
      await sendEventNotification({
        telegramUserId,
        message: `✅ Вы записаны на обучение: ${data.registration.type}`,
      })
    }
  }

  res.status(201).json(data)
}

export const unregisterFromClientUi = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) throw unauthorized()

  const data = await service.unregister(req.body as CreateClientUiRegistrationDto, userId)

  res.json(data)
}
