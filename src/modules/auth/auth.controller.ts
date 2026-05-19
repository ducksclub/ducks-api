import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client.js'
import { AuthService } from './auth.service.js'
import { verifyTelegramWebAppData } from '../../common/utils/telegram-auth.js'

const service = new AuthService(prisma)

export const register = async (req: Request, res: Response) => {
  let telegramUser

  if (req.body.initData) {
    const isValid = verifyTelegramWebAppData(req.body.initData, process.env.BOT_TOKEN!)

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid telegram auth',
      })
    }

    const params = new URLSearchParams(req.body.initData)
    const userRaw = params.get('user')

    if (!userRaw) {
      return res.status(400).json({
        error: 'Telegram user missing',
      })
    }

    telegramUser = JSON.parse(decodeURIComponent(userRaw))
  }

  const result = await service.register(req.body, telegramUser)
  res.status(201).json(result)
}

export const login = async (req: Request, res: Response) => {
  res.json(await service.login(req.body))
}

export const telegramAuth = async (req: Request, res: Response) => {
  const { initData } = req.body

  if (!initData) {
    return res.status(400).json({
      error: 'initData required',
    })
  }

  const isValid = verifyTelegramWebAppData(initData, process.env.BOT_TOKEN!)

  if (!isValid) {
    return res.status(401).json({
      error: 'Invalid telegram auth',
    })
  }

  const params = new URLSearchParams(initData)
  const userRaw = params.get('user')

  if (!userRaw) {
    return res.status(400).json({
      error: 'Telegram user missing',
    })
  }

  const telegramUser = JSON.parse(decodeURIComponent(userRaw))
  const data = await service.telegramLogin(telegramUser, req.body.promoCode ?? req.body.sourceCode ?? null)

  return res.json(data)
}
