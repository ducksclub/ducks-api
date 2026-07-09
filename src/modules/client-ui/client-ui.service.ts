import type { PrismaClient } from '@prisma/client'
import { ClientUiTypes } from './client-ui.schemas.js'
import type { ChangeClientUiDto } from './client-ui.schemas.js'

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
}
