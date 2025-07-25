import crypto from 'crypto'

export function validateSignature(body: string, channelSecret: string, signature: string): boolean {
  if (!channelSecret || !signature) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('SHA256', channelSecret)
    .update(body, 'utf8')
    .digest('base64')

  return signature === expectedSignature
}