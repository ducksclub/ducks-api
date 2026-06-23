import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const telegramProductionPublicKey =
  'e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d'
const ed25519SpkiPrefix = '302a300506032b6570032100'

export function verifyTelegramWebAppData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  const signature = params.get('signature')

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

  return (
    verifyTelegramWebAppHash(dataCheckString, hash, botToken) ||
    verifyTelegramWebAppSignature(dataCheckString, signature, botToken)
  )
}

function verifyTelegramWebAppHash(dataCheckString: string, hash: string, botToken: string) {
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()

  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
  const hmacBuffer = Buffer.from(hmac, 'hex')
  const hashBuffer = Buffer.from(hash, 'hex')

  if (hmacBuffer.length !== hashBuffer.length) return false

  return crypto.timingSafeEqual(hmacBuffer, hashBuffer)
}

function verifyTelegramWebAppSignature(
  dataCheckString: string,
  signature: string | null,
  botToken: string,
) {
  if (!signature) return false

  const botId = botToken.split(':')[0]

  if (!botId) return false

  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(`${ed25519SpkiPrefix}${telegramProductionPublicKey}`, 'hex'),
      format: 'der',
      type: 'spki',
    })
    const signatureBuffer = Buffer.from(base64UrlToBase64(signature), 'base64')
    const signedDataCheckString = `${botId}:WebAppData\n${dataCheckString}`

    return crypto.verify(null, Buffer.from(signedDataCheckString), publicKey, signatureBuffer)
  } catch {
    return false
  }
}

function base64UrlToBase64(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)

  return `${base64}${padding}`
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
