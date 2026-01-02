import { createHash } from 'node:crypto'

export interface JWTi {
  customerNumber: string
}

export const decode = (jwt: string) => {
  const [, payload] = jwt.split('.')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as JWTi
}

export const pepper = (text: string, secret: string) => {
  return createHash('sha256').update(text).update(secret).digest('base64url')
}
