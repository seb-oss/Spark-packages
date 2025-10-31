import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { JsonObject, ProxyConfig } from './types.js'

// Mocks for JWT helpers
vi.mock('./jwt', () => ({
  createJwt: vi.fn(async (_claims: JsonObject) => 'signed-local-jwt'),
  getRemoteJwt: vi.fn(
    async (_url: string, _claims: JsonObject) => 'signed-remote-jwt'
  ),
}))

import { introspect } from './introspection.js'
// Use the real utils + introspect after mocks are set up
import { createJwt, getRemoteJwt } from './jwt.js'
import { getHeader, parseAuthorizationHeader } from './utils.js'

const b64u = (o: unknown) =>
  Buffer.from(JSON.stringify(o)).toString('base64url')

describe('introspect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns headers unchanged when no Authorization header', async () => {
    const headers = { 'x-test': '1' }
    const cfg: ProxyConfig = { target: 'http://core:3000', mode: 'local' }
    const res = await introspect(cfg, headers)
    expect(res).toEqual(headers)
  })

  it('local mode: replaces Authorization with a signed JWT', async () => {
    const claims = { sub: 'u-123', sid: 's-456' } satisfies JsonObject
    const token = b64u(claims)
    const headers = { authorization: `Bearer ${token}`, 'x-test': '1' }
    const cfg: ProxyConfig = { target: 'http://core:3000', mode: 'local' }

    const out = await introspect(cfg, headers)

    expect(createJwt).toHaveBeenCalledWith(claims)
    expect(getRemoteJwt).not.toHaveBeenCalled()
    expect(getHeader(out, 'authorization')).toBe('Bearer signed-local-jwt')
    // preserves other headers
    expect(out['x-test']).toBe('1')
  })

  it('downstream mode (explicit): uses getRemoteJwt with configured URL', async () => {
    const claims = { sub: 'u-1' } satisfies JsonObject
    const headers = { authorization: `Bearer ${b64u(claims)}` }
    const cfg: ProxyConfig = {
      target: 'http://core:3000',
      mode: 'downstream',
      downstream: 'https://issuer.example/api/token',
    }

    const out = await introspect(cfg, headers)

    expect(getRemoteJwt).toHaveBeenCalledWith(
      'https://issuer.example/api/token',
      claims
    )
    expect(createJwt).not.toHaveBeenCalled()
    expect(getHeader(out, 'authorization')).toBe('Bearer signed-remote-jwt')
  })

  it('downstream mode (inferred from downstream presence): uses getRemoteJwt', async () => {
    const claims = { foo: 'bar' } satisfies JsonObject
    const headers = { authorization: `Bearer ${b64u(claims)}` }
    const cfg = {
      target: 'http://core:3000',
      // mode omitted on purpose
      downstream: 'https://issuer.example/api/token',
    } as unknown as ProxyConfig

    const out = await introspect(cfg, headers)

    expect(getRemoteJwt).toHaveBeenCalledWith(
      'https://issuer.example/api/token',
      claims
    )
    expect(getHeader(out, 'authorization')).toBe('Bearer signed-remote-jwt')
  })

  it('throws when Authorization header is invalid (not base64url JSON)', async () => {
    const headers = { authorization: 'Bearer not-a-b64u-json' }
    const cfg: ProxyConfig = { target: 'http://core:3000', mode: 'local' }

    await expect(introspect(cfg, headers)).rejects.toBeInstanceOf(Error)
  })
})
