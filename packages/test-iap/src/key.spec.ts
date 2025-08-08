import { calculateJwkThumbprint, exportJWK } from 'jose'
// src/key.spec.ts
import { beforeAll, describe, expect, it } from 'vitest'
import { generateKey } from './keys'
import type { Key } from './keys'

let mainKey: Key

describe('generateKey', () => {
  // Generate once to speed up the suite
  beforeAll(async () => {
    mainKey = await generateKey()
  })

  it('returns an RS256 keypair and JWK with alg and kid (thumbprint)', async () => {
    expect(mainKey.privateKey).toBeTruthy()
    expect(mainKey.publicKey).toBeTruthy()
    expect(mainKey.jwk.alg).toBe('RS256')
    expect(mainKey.jwk.kty).toBe('RSA')
    expect(typeof mainKey.jwk.kid).toBe('string')

    const pubJwk = await exportJWK(mainKey.publicKey)
    const thumb = await calculateJwkThumbprint(pubJwk)
    expect(mainKey.jwk.kid).toBe(thumb)
  })

  it('produces different kids for different keypairs', async () => {
    const another = await generateKey()
    expect(mainKey.jwk.kid).not.toBe(another.jwk.kid)
  })

  it('public JWK content matches (n/e) and only augments with alg/kid', async () => {
    const pubJwk = await exportJWK(mainKey.publicKey)
    expect(pubJwk.n).toBe(mainKey.jwk.n)
    expect(pubJwk.e).toBe(mainKey.jwk.e)
    expect(pubJwk.kty).toBe(mainKey.jwk.kty)

    expect(mainKey.jwk.alg).toBe('RS256')
    expect(typeof mainKey.jwk.kid).toBe('string')
  })
})
