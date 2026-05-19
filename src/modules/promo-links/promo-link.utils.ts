import { PromoLinkType } from '@prisma/client'
import { env } from '../../config/env.js'

const transliterationMap: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ы: 'y',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export const normalizePromoCode = (value: string): string => {
  const transliterated = value
    .trim()
    .toLowerCase()
    .split('')
    .map((char) => transliterationMap[char] ?? char)
    .join('')

  const code = transliterated
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')

  return code || 'promo'
}

const joinPublicSiteUrl = (targetUrl?: string | null) => {
  const baseUrl = env.PUBLIC_SITE_URL.replace(/\/+$/, '')
  const normalizedTarget = !targetUrl || targetUrl === '/' ? '' : `/${targetUrl.replace(/^\/+/, '')}`
  return `${baseUrl}${normalizedTarget}`
}

export const generatePromoUrl = (params: {
  type: PromoLinkType
  code: string
  targetUrl?: string | null | undefined
}): string => {
  const code = encodeURIComponent(params.code)

  if (params.type === PromoLinkType.TELEGRAM_BOT) {
    return `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${code}`
  }

  if (params.type === PromoLinkType.TELEGRAM_MINI_APP) {
    const miniAppSlug = env.TELEGRAM_MINI_APP_SLUG.replace(/^\/+|\/+$/g, '')
    return `https://t.me/${env.TELEGRAM_BOT_USERNAME}/${miniAppSlug}?startapp=${code}`
  }

  const publicUrl = joinPublicSiteUrl(params.targetUrl)
  const separator = publicUrl.includes('?') ? '&' : '?'
  return `${publicUrl}${separator}promo=${code}`
}
