import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyTelegramWebAppData } from '../../src/common/utils/telegram-auth.js'

function createInitData(botToken: string, data: Record<string, string>) {
  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n')

  const secret = crypto.createHash('sha256').update(botToken).digest()
  const hash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
  const params = new URLSearchParams(data)

  params.set('hash', hash)

  return params.toString()
}

describe('verifyTelegramWebAppData', () => {
  const botToken = '123456:telegram-bot-token'

  it('accepts init data signed with bot token', () => {
    const initData = createInitData(botToken, {
      auth_date: '1710000000',
      query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
      user: JSON.stringify({
        id: 123,
        first_name: 'Test',
        username: 'test_user',
      }),
    })

    expect(verifyTelegramWebAppData(initData, botToken)).toBe(true)
  })

  it('rejects tampered init data', () => {
    const initData = createInitData(botToken, {
      auth_date: '1710000000',
      user: JSON.stringify({
        id: 123,
        first_name: 'Test',
      }),
    })

    const params = new URLSearchParams(initData)
    params.set(
      'user',
      JSON.stringify({
        id: 456,
        first_name: 'Test',
      }),
    )

    expect(verifyTelegramWebAppData(params.toString(), botToken)).toBe(false)
  })
})
