import type { PrismaClient } from '@prisma/client'
import { ClientUiTypes } from './client-ui.schemas.js'
import type { ChangeClientUiDto, CreateClientUiRegistrationDto } from './client-ui.schemas.js'

const CLIENT_UI_SETTING_ID = 'default'

export class ClientUiService {
  constructor(private readonly prisma: PrismaClient) {}

  async get() {
    return this.prisma.clientUiSetting.upsert({
      where: { id: CLIENT_UI_SETTING_ID },
      create: { id: CLIENT_UI_SETTING_ID, type: ClientUiTypes.POKER },
      update: {},
    })
  }

  async update(dto: ChangeClientUiDto) {
    return this.prisma.clientUiSetting.upsert({
      where: { id: CLIENT_UI_SETTING_ID },
      create: { id: CLIENT_UI_SETTING_ID, type: dto.type },
      update: { type: dto.type },
    })
  }

  async listRegistrations(type: string) {
    return this.prisma.clientUiRegistration.findMany({
      where: { type },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  async getUserRegistration(type: string, userId: string) {
    return this.prisma.clientUiRegistration.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    })
  }

  async getUserTelegramId(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true },
    })
  }

  async register(dto: CreateClientUiRegistrationDto, userId: string) {
    const existing = await this.getUserRegistration(dto.type, userId)

    const registration =
      existing ??
      (await this.prisma.clientUiRegistration.create({
        data: {
          userId,
          type: dto.type,
        },
        select: {
          id: true,
          type: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true,
            },
          },
        },
      }))

    const registrations = await this.listRegistrations(dto.type)

    return {
      registration,
      registrations,
      isNewRegistration: !existing,
    }
  }

  async unregister(dto: CreateClientUiRegistrationDto, userId: string) {
    await this.prisma.clientUiRegistration.deleteMany({
      where: {
        userId,
        type: dto.type,
      },
    })

    const registrations = await this.listRegistrations(dto.type)

    return {
      registration: null,
      registrations,
    }
  }
}
