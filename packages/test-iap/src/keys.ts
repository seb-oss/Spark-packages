import assert from 'node:assert'
import {
  calculateJwkThumbprint,
  exportJWK,
  generateKeyPair,
  type JWK_RSA_Public,
} from 'jose'

type JWK = JWK_RSA_Public & { alg: string; kid: string }

export interface Key {
  publicKey: CryptoKey
  privateKey: CryptoKey
  jwk: JWK
}

export const generateKey = async (): Promise<Key> => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const exported = await exportJWK(publicKey)
  const { n, e } = exported
  assert(n && e, 'exported RSA public JWK must have n and e')
  const kid = await calculateJwkThumbprint(exported)
  const jwk: JWK = { ...exported, n, e, kid, alg: 'RS256' }

  return { publicKey, privateKey, jwk }
}
