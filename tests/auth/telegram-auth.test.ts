import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyTelegramWebAppData } from '../../src/common/utils/telegram-auth.js'

function createTelegramInitData(
  botToken: string,
  data: Record<string, string>,
) {
  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n')

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
  const params = new URLSearchParams(data)

  params.set('hash', hash)

  return params.toString()
}

describe('verifyTelegramWebAppData', () => {
  const botToken = '123456:telegram-bot-token'

  it('accepts valid Telegram WebApp initData', () => {
    const initData = createTelegramInitData(botToken, {
      auth_date: '1710000000',
      query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
      user: JSON.stringify({
        id: 123456789,
        first_name: 'Alex',
        username: 'alex_duck',
      }),
    })

    expect(verifyTelegramWebAppData(initData, botToken)).toBe(true)
  })

  it('rejects initData changed after signing', () => {
    const initData = createTelegramInitData(botToken, {
      auth_date: '1710000000',
      user: JSON.stringify({
        id: 123456789,
        first_name: 'Alex',
      }),
    })
    const params = new URLSearchParams(initData)

    params.set(
      'user',
      JSON.stringify({
        id: 987654321,
        first_name: 'Alex',
      }),
    )

    expect(verifyTelegramWebAppData(params.toString(), botToken)).toBe(false)
  })

  it('rejects missing or malformed hash', () => {
    expect(verifyTelegramWebAppData('auth_date=1710000000', botToken)).toBe(false)
    expect(verifyTelegramWebAppData('auth_date=1710000000&hash=bad', botToken)).toBe(false)
  })
})
