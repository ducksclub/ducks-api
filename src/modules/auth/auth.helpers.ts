import crypto from 'node:crypto'
import { env } from '../../config/env'
import { Prisma } from '@prisma/client'
import { telegramWebAppUserSchema } from './auth.schemas'
import { badRequest, conflict, unauthorized } from '../../common/errors/app-error'
import { verifyTelegramWebAppData } from '../../common/utils/telegram-auth'
import type { PublicUser, TelegramWebAppUserDto, UserWithPassword } from './auth.types'

function parseTelegramWebAppUser(initData: string): TelegramWebAppUserDto {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  const authDate = params.get('auth_date')
  const userRaw = params.get('user')

  if (!hash) {
    throw badRequest('Hash авторизации Telegram отсутствует')
  }
  if (!authDate) {
    throw badRequest('Дата авторизации Telegram отсутствует')
  }
  if (!userRaw) {
    throw badRequest('Данные пользователя Telegram отсутствуют')
  }

  if (!verifyTelegramWebAppData(initData, env.BOT_TOKEN)) {
    throw unauthorized('Некорректные данные авторизации Telegram')
  }

  let userJson: unknown

  try {
    userJson = JSON.parse(userRaw)
  } catch {
    throw badRequest('Данные пользователя Telegram должны быть валидным JSON')
  }

  const parsedUser = telegramWebAppUserSchema.safeParse(userJson)

  if (!parsedUser.success) {
    throw badRequest('Некорректные данные пользователя Telegram', parsedUser.error.flatten())
  }

  return parsedUser.data
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

export function getRequiredTelegramIdClaim(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  throw unauthorized('Telegram id отсутствует в данных авторизации')
}

export function getOptionalStringClaim(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function isTelegramTokenError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name.startsWith('JWT') ||
      error.name === 'JOSEError' ||
      error.message.includes('"aud"') ||
      error.message.includes('"iss"'))
  )
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
const minNicknameLength = 3
const maxNicknameAttempts = 20

type NicknameExists = (nickname: string) => Promise<unknown>

function normalizeTelegramNickname(baseNickname: string, telegramId: string) {
  const normalized = baseNickname.trim().replace(/^@/, '')
  const fallback = `tg_user_${telegramId}`
  const nickname = normalized.length >= minNicknameLength ? normalized : fallback

  return nickname.slice(0, maxNicknameLength)
}

export async function createAvailableTelegramNickname(
  baseNickname: string,
  telegramId: string,
  nicknameExists: NicknameExists,
) {
  const normalizedBaseNickname = normalizeTelegramNickname(baseNickname, telegramId)

  if (!(await nicknameExists(normalizedBaseNickname))) {
    return normalizedBaseNickname
  }

  for (let attempt = 0; attempt < maxNicknameAttempts; attempt += 1) {
    const suffix = attempt === 0 ? telegramId : `${telegramId}_${attempt}`
    const availableBaseLength = Math.max(1, maxNicknameLength - suffix.length - 1)
    const nickname = `${normalizedBaseNickname.slice(0, availableBaseLength)}_${suffix}`.slice(
      0,
      maxNicknameLength,
    )

    if (!(await nicknameExists(nickname))) {
      return nickname
    }
  }

  throw conflict('Не удалось подобрать уникальный nickname')
}

export function createPasswordResetToken() {
  return crypto.randomBytes(32).toString('base64url')
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function buildPasswordResetUrl(token: string) {
  const url = new URL('/reset-password', env.PUBLIC_SITE_URL)
  url.searchParams.set('token', token)

  return url.toString()
}
