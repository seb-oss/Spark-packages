import type { IncomingMessage, RequestOptions } from 'node:http'
import { Socket } from 'node:net'
import { describe, expect, it } from 'vitest'
import { normHttpRequest, normHttpResponse } from './normalize-http'

describe('normHttpRequest (Node.js http-aligned)', () => {
  it('derives hostname from host (with port)', () => {
    const req = normHttpRequest({
      host: 'example.com:8080',
      path: '/test',
      method: 'GET',
    })

    expect(req.hostname).toBe('example.com')
    expect(req.port).toBe(80) // default since not explicitly set
  })
  it('prefers hostname over host', () => {
    const req = normHttpRequest({
      host: 'wrong.com',
      hostname: 'correct.com',
      path: '/',
    })

    expect(req.hostname).toBe('correct.com')
  })
  it('respects explicit port', () => {
    const req = normHttpRequest({
      hostname: 'example.com',
      port: 3000,
    })

    expect(req.port).toBe(3000)
    expect(req.protocol).toBe('http')
  })
  it('infers https from port 443 (Node convention)', () => {
    const req = normHttpRequest({
      hostname: 'example.com',
      port: 443,
    })

    expect(req.protocol).toBe('https')
  })
  it('defaults method and path like Node', () => {
    const req = normHttpRequest({
      hostname: 'example.com',
    })

    expect(req.method).toBe('GET')
    expect(req.path).toBe('/')
  })
  it('handles case-insensitive header lookup', () => {
    const req = normHttpRequest({
      hostname: 'example.com',
      headers: {
        'Content-Type': 'application/json',
        'x-test': '123',
      },
    })

    expect(req.getHeader('content-type')).toEqual(['application/json'])
    expect(req.getHeader('Content-Type')).toEqual(['application/json'])
    expect(req.getHeader('x-test')).toEqual(['123'])
  })
  it('returns all values for array headers', () => {
    const req = normHttpRequest({
      hostname: 'example.com',
      headers: {
        'set-cookie': ['a=1', 'b=2'],
      },
    })

    expect(req.getHeader('set-cookie')).toEqual(['a=1', 'b=2'])
  })
  it('returns undefined for missing headers', () => {
    const req = normHttpRequest({
      hostname: 'example.com',
    })

    expect(req.getHeader('x-missing')).toBeUndefined()
  })
  it('ignores headers when provided as raw array (Node edge case)', () => {
    const req = normHttpRequest({
      hostname: 'example.com',
      headers: [] as any,
    })

    expect(req.getHeader('anything')).toBeUndefined()
  })
})
describe('normHttpResponse (Node.js http-aligned)', () => {
  const makeRes = (
    overrides: Partial<IncomingMessage> = {}
  ): IncomingMessage => {
    const res: Partial<IncomingMessage> = {
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
        remotePort: 12345,
      } as Partial<Socket> as Socket,
      ...overrides,
    }
    return res as IncomingMessage
  }
  it('exposes status and socket metadata', () => {
    const res = normHttpResponse(makeRes())

    expect(res.statusCode).toBe(200)
    expect(res.statusMessage).toBe('OK')
    expect(res.remoteAddress).toBe('127.0.0.1')
    expect(res.remotePort).toBe(12345)
  })
  it('handles case-insensitive header lookup', () => {
    const res = normHttpResponse(
      makeRes({
        headers: {
          'content-type': 'application/json',
        },
      })
    )

    expect(res.getHeader('content-type')).toEqual(['application/json'])
    expect(res.getHeader('Content-Type')).toEqual(['application/json'])
  })
  it('returns all values for duplicate headers', () => {
    const res = normHttpResponse(
      makeRes({
        headers: {
          'set-cookie': ['a=1', 'b=2'],
        },
      })
    )

    expect(res.getHeader('set-cookie')).toEqual(['a=1', 'b=2'])
  })
  it('returns undefined when header is missing', () => {
    const res = normHttpResponse(
      makeRes({
        headers: {},
      })
    )

    expect(res.getHeader('x-missing')).toBeUndefined()
  })
  it('handles missing socket (edge case)', () => {
    const res = normHttpResponse({
      statusCode: 200,
      statusMessage: 'OK',
      headers: {},
      socket: undefined,
    } as any)

    expect(res.remoteAddress).toBeUndefined()
    expect(res.remotePort).toBeUndefined()
  })
  it('handles undefined status fields defensively', () => {
    const res = normHttpResponse({
      headers: {},
      socket: undefined,
    } as any)

    expect(res.statusCode).toBe(0)
    expect(res.statusMessage).toBe('')
  })
})
