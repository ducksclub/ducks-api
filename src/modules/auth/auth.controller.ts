import type { Request, Response } from 'express'
import { prisma } from '../../prisma/client.js'
import { AuthService } from './auth.service.js'

const service = new AuthService(prisma)

export const register = async (req: Request, res: Response) => {
  const result = await service.register(req.body)
  res.status(201).json(result)
}

export const login = async (req: Request, res: Response) => {
  res.json(await service.login(req.body))
}
