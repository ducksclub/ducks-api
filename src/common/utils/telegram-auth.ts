import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

// в данной функции я не разобрался и есть сомнение
export function verifyTelegramWebAppData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData)

  const hash = params.get('hash')

  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return false

  params.delete('hash')
  params.delete('signature')

  const data: Record<string, string> = {}

  params.forEach((value, key) => {
    data[key] = value
  })

  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join('\n')

  const secret = crypto.createHash('sha256').update(botToken).digest()

  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(hash, 'hex'))
}

type Payload = {
  id: string
  role: string
}

export function generateToken(payload: Payload) {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  })
}
