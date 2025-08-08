import {
  type JWK_RSA_Public,
  calculateJwkThumbprint,
  exportJWK,
  generateKeyPair,
} from 'jose'

type JWK = JWK_RSA_Public & { alg: string; kid: string }

export interface Key {
  publicKey: CryptoKey
  privateKey: CryptoKey
  jwk: JWK
}

export const generateKey = async (): Promise<Key> => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  jwk.kid = await calculateJwkThumbprint(jwk)
  jwk.alg = 'RS256'

  return { publicKey, privateKey, jwk: jwk as JWK }
}
