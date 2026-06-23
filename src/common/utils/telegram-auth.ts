import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

export function verifyTelegramWebAppData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')

  if (!hash) return false

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

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()

  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
  const hmacBuffer = Buffer.from(hmac, 'hex')
  const hashBuffer = Buffer.from(hash, 'hex')

  if (hmacBuffer.length !== hashBuffer.length) return false

  return crypto.timingSafeEqual(hmacBuffer, hashBuffer)
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
