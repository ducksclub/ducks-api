import { env } from '../../config/env'
import { Prisma } from '@prisma/client'
import { telegramWebAppUserSchema } from './auth.schemas'
import { badRequest, conflict, unauthorized } from '../../common/errors/app-error'
import { verifyTelegramWebAppData } from '../../common/utils/telegram-auth'
import type { PublicUser, TelegramWebAppUserDto, UserWithPassword } from './auth.types'

function parseTelegramWebAppUser(initData: string): TelegramWebAppUserDto {
  if (!verifyTelegramWebAppData(initData, env.BOT_TOKEN)) {
    throw unauthorized('Некорректные данные авторизации Telegram')
  }

  const userRaw = new URLSearchParams(initData).get('user')

  if (!userRaw) {
    throw badRequest('Данные пользователя Telegram отсутствуют')
  }

  try {
    return telegramWebAppUserSchema.parse(JSON.parse(userRaw))
  } catch {
    throw badRequest('Не удалось спарсить данные пользователя Telegram')
  }
}

export function parseTelegramWebAppUserFromInitData(
  initData?: string,
): TelegramWebAppUserDto | undefined {
  return initData ? parseTelegramWebAppUser(initData) : undefined
}

export function getTelegramWebAppUserFromInitData(initData?: string): TelegramWebAppUserDto {
  if (!initData) {
    throw badRequest('Данные авторизации Telegram обязательны')
  }

  return parseTelegramWebAppUser(initData)
}

export const publicUserSelect = {
  id: true,
  role: true,
  email: true,
  phone: true,
  nickname: true,
  avatarUrl: true,
  telegramId: true,
} satisfies Prisma.UserSelect

export const userWithPasswordSelect = {
  ...publicUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect

export function toPublicUser(user: UserWithPassword): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...publicUser } = user

  return publicUser
}

const maxNicknameLength = 30
const maxNicknameAttempts = 20

type NicknameExists = (nickname: string) => Promise<unknown>

export async function createAvailableTelegramNickname(
  baseNickname: string,
  telegramId: string,
  nicknameExists: NicknameExists,
) {
  if (!(await nicknameExists(baseNickname))) {
    return baseNickname
  }

  for (let attempt = 0; attempt < maxNicknameAttempts; attempt += 1) {
    const suffix = attempt === 0 ? telegramId : `${telegramId}_${attempt}`
    const nickname = `${baseNickname.slice(0, maxNicknameLength - suffix.length - 1)}_${suffix}`

    if (!(await nicknameExists(nickname))) {
      return nickname
    }
  }

  throw conflict('Не удалось подобрать уникальный nickname')
}
