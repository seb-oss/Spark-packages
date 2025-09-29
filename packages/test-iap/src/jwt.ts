import { randomUUID } from 'node:crypto'
import { SignJWT } from 'jose'
import { generateKey, type Key } from './keys'
import type { JsonObject } from './types'

let _key: Key | undefined
export const getKey = async (): Promise<Key> => {
  if (!_key) {
    _key = await generateKey()
  }
  return _key
}

const defaultClaims = (): JsonObject => ({
  jti: randomUUID(),
  sub: randomUUID(),
  groups: [],
  aud: ['SEB'],
  sid: randomUUID(),
})

export const createJwt = async (claims: JsonObject) => {
  const payload = { ...defaultClaims(), ...claims }

  // Map user -> preferred_username (and remove user)
  const hasUser = Object.hasOwn(payload, 'user')
  const hasPreferred = Object.hasOwn(payload, 'preferred_username')

  if (hasUser && !hasPreferred && typeof payload.user === 'string') {
    payload.preferred_username = payload.user
  }
  if (hasUser) {
    delete (payload as { user?: string }).user
  }

  const key = await getKey()
  const { alg, kid } = key.jwk
  return await new SignJWT(payload)
    .setIssuedAt()
    .setNotBefore('0s')
    .setExpirationTime('5m')
    .setProtectedHeader({ alg, kid, typ: 'JWT' })
    .sign(key.privateKey)
}

export const getRemoteJwt = async (remoteUrl: string, claims: JsonObject) => {
  const url = new URL(remoteUrl)

  for (const [name, val] of Object.entries(claims)) {
    url.searchParams.set(name, val as string)
  }

  const res = await fetch(url)
  const text = await res.text()
  if (!res.ok)
    throw new Error(`remote jwt fetch failed: ${res.status} ${res.statusText}`)

  return text
}
