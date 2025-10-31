import { importJWK, jwtVerify } from 'jose'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createJwt, getKey, getRemoteJwt } from './jwt.js'
import type { JsonObject } from './types.js'

describe('createJwt', () => {
  const fixed = new Date('2030-01-01T00:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fixed)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('signs a valid RS256 JWT with expected header and payload merges', async () => {
    const claims: JsonObject = {
      sub: 'user-override',
      sid: 'sess-1',
      extra: 'x',
    }

    const jwt = await createJwt(claims)

    // verify signature using the public JWK from the same key
    const key = await getKey()
    const pub = await importJWK(key.jwk, 'RS256')
    const { protectedHeader, payload } = await jwtVerify(jwt, pub)

    // header
    expect(protectedHeader.alg).toBe('RS256')
    expect(protectedHeader.kid).toBe(key.jwk.kid)
    expect(protectedHeader.typ).toBe('JWT')

    // payload merges: provided claims override defaults
    expect(payload.sub).toBe('user-override')
    expect(payload.sid).toBe('sess-1')
    expect(payload.extra).toBe('x')

    // defaults present
    expect(Array.isArray(payload.groups)).toBe(true)
    // aud can be string or array in JWTs; your default is array
    expect(payload.aud).toEqual(['SEB'])
    expect(typeof payload.jti).toBe('string')

    // times are NumericDate (seconds)
    const now = Math.floor(fixed.getTime() / 1000)
    expect(payload.iat).toBe(now)
    expect(payload.nbf).toBe(now)
    expect(payload.exp).toBe(now + 300)
  })

  it('replaces property user with preferred_username', async () => {
    const jwt = await createJwt({ user: 'foo' } as JsonObject)
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')
    )

    expect(payload.preferred_username).toBe('foo')
    expect(payload.user).toBeUndefined()
  })

  it('includes preferred_username', async () => {
    const jwt = await createJwt({ preferred_username: 'foo' } as JsonObject)
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')
    )

    expect(payload.preferred_username).toBe('foo')
    expect(payload.user).toBeUndefined()
  })

  it('prioritizes preferred_username over user', async () => {
    const jwt = await createJwt({
      user: 'foo',
      preferred_username: 'bar',
    } as JsonObject)
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')
    )

    expect(payload.preferred_username).toBe('bar')
    expect(payload.user).toBeUndefined()
  })
})

describe('getRemoteJwt', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('appends claims as query params and returns response text', async () => {
    const base = 'https://issuer.example'
    const path = '/api/token'
    const claims: JsonObject = { user: '123', sid: 'abc-123' }

    nock(base)
      .get(path)
      .query({ user: '123', sid: 'abc-123' })
      .reply(200, 'signed-remote-token')

    const token = await getRemoteJwt(`${base}${path}`, claims)
    expect(token).toBe('signed-remote-token')
    expect(nock.isDone()).toBe(true) // all expected calls hit
  })

  it('throws on non-2xx', async () => {
    const base = 'https://issuer.example'
    const path = '/api/token'

    nock(base).get(path).query(true).reply(500, 'ouch')

    await expect(getRemoteJwt(`${base}${path}`, { sub: 'x' })).rejects.toThrow(
      /remote jwt fetch failed: 500/i
    )

    expect(nock.isDone()).toBe(true)
  })
})
