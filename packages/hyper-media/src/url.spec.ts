import type { Request } from 'express'
import { beforeEach, describe, expect, it } from 'vitest'
import { resolveUrl } from './url'

const mockRequest = (
  headers: Partial<Record<string, string | undefined>> = {},
  originalUrl = '/orders'
): Request => {
  const defaultHeaders: Record<string, string> = {
    'x-forwarded-host': 'api.example.com',
    'x-forwarded-prefix': '/trading/exchange,/v1',
  }
  const merged = { ...defaultHeaders, ...headers }
  return {
    get: (name: string) => merged[name.toLowerCase()] ?? null,
    originalUrl,
  } as Partial<Request> as Request
}

describe('resolveUrl', () => {
  describe('host resolution', () => {
    it('uses x-forwarded-host over host header', () => {
      const req = mockRequest({ host: 'internal.gcp.local' })
      expect(resolveUrl(req, '/foo')).toBe(
        '//api.example.com/trading/exchange/v1/foo'
      )
    })
    it('falls back to host header when x-forwarded-host is absent', () => {
      const req = mockRequest({
        'x-forwarded-host': undefined,
        host: 'internal.gcp.local',
      })
      expect(resolveUrl(req, '/foo')).toBe(
        '//internal.gcp.local/trading/exchange/v1/foo'
      )
    })
    it('uses first value when x-forwarded-host contains multiple values', () => {
      const req = mockRequest({
        'x-forwarded-host': 'api.example.com, other.example.com',
      })
      expect(resolveUrl(req, '/foo')).toBe(
        '//api.example.com/trading/exchange/v1/foo'
      )
    })
    it('handles missing host gracefully', () => {
      const req = mockRequest({
        'x-forwarded-host': undefined,
        host: undefined,
      })
      expect(resolveUrl(req, '/foo')).toBe('///trading/exchange/v1/foo')
    })
  })

  describe('prefix resolution', () => {
    it('joins multiple x-forwarded-prefix segments into a single path', () => {
      const req = mockRequest({ 'x-forwarded-prefix': '/trading/exchange,/v1' })
      expect(resolveUrl(req, '/foo')).toBe(
        '//api.example.com/trading/exchange/v1/foo'
      )
    })
    it('handles single prefix segment', () => {
      const req = mockRequest({ 'x-forwarded-prefix': '/trading/exchange' })
      expect(resolveUrl(req, '/foo')).toBe(
        '//api.example.com/trading/exchange/foo'
      )
    })
    it('handles prefix segments with extra whitespace', () => {
      const req = mockRequest({
        'x-forwarded-prefix': '/trading/exchange , /v1',
      })
      expect(resolveUrl(req, '/foo')).toBe(
        '//api.example.com/trading/exchange/v1/foo'
      )
    })
    it('handles missing x-forwarded-prefix', () => {
      const req = mockRequest({ 'x-forwarded-prefix': undefined })
      expect(resolveUrl(req, '/foo')).toBe('//api.example.com/foo')
    })
    it('handles trailing slash on prefix segment', () => {
      const req = mockRequest({
        'x-forwarded-prefix': '/trading/exchange/,/v1',
      })
      expect(resolveUrl(req, '/foo')).toBe(
        '//api.example.com/trading/exchange/v1/foo'
      )
    })
  })

  describe('self link (no url)', () => {
    it('constructs self link from request', () => {
      const req = mockRequest()
      expect(resolveUrl(req)).toBe(
        '//api.example.com/trading/exchange/v1/orders'
      )
    })
    it('preserves query string in self link', () => {
      const req = mockRequest({}, '/orders?page=1&limit=10')
      expect(resolveUrl(req)).toBe(
        '//api.example.com/trading/exchange/v1/orders?page=1&limit=10'
      )
    })
    it('handles self link with no prefix', () => {
      const req = mockRequest({ 'x-forwarded-prefix': undefined })
      expect(resolveUrl(req)).toBe('//api.example.com/orders')
    })
    it('handles self link with root originalUrl', () => {
      const req = mockRequest({}, '/')
      expect(resolveUrl(req)).toBe('//api.example.com/trading/exchange/v1')
    })
  })

  describe('absolute path /foo', () => {
    let req: Request
    beforeEach(() => {
      req = mockRequest()
    })
    it('appends absolute path to prefix only, ignoring originalUrl', () => {
      expect(resolveUrl(req, '/orders/new')).toBe(
        '//api.example.com/trading/exchange/v1/orders/new'
      )
    })
    it('handles root absolute path', () => {
      expect(resolveUrl(req, '/')).toBe(
        '//api.example.com/trading/exchange/v1/'
      )
    })
    it('handles deeply nested absolute path', () => {
      expect(resolveUrl(req, '/a/b/c/d')).toBe(
        '//api.example.com/trading/exchange/v1/a/b/c/d'
      )
    })
    it('does not include originalUrl in result', () => {
      expect(resolveUrl(req, '/foo')).toBe(
        '//api.example.com/trading/exchange/v1/foo'
      )
    })
  })

  describe('relative path ./foo', () => {
    it('appends to prefix and originalUrl', () => {
      const req = mockRequest()
      expect(resolveUrl(req, './detail')).toBe(
        '//api.example.com/trading/exchange/v1/orders/detail'
      )
    })
    it('handles nested relative path', () => {
      const req = mockRequest()
      expect(resolveUrl(req, './a/b/c')).toBe(
        '//api.example.com/trading/exchange/v1/orders/a/b/c'
      )
    })
    it('strips trailing slash from originalUrl before appending', () => {
      const req = mockRequest({}, '/orders/')
      expect(resolveUrl(req, './detail')).toBe(
        '//api.example.com/trading/exchange/v1/orders/detail'
      )
    })
    it('strips query string from originalUrl before appending', () => {
      const req = mockRequest({}, '/orders?page=1')
      expect(resolveUrl(req, './detail')).toBe(
        '//api.example.com/trading/exchange/v1/orders/detail'
      )
    })
  })

  describe('bare string path', () => {
    it('treats bare string as relative to current resource', () => {
      const req = mockRequest()
      expect(resolveUrl(req, 'detail')).toBe(
        '//api.example.com/trading/exchange/v1/orders/detail'
      )
    })
    it('treats bare string with slashes as relative to current resource', () => {
      const req = mockRequest()
      expect(resolveUrl(req, 'detail/summary')).toBe(
        '//api.example.com/trading/exchange/v1/orders/detail/summary'
      )
    })
  })

  describe('parent path ../foo', () => {
    it('walks up one level from originalUrl', () => {
      const req = mockRequest()
      expect(resolveUrl(req, '../ping')).toBe(
        '//api.example.com/trading/exchange/v1/ping'
      )
    })
    it('walks up two levels from a nested originalUrl', () => {
      const req = mockRequest({}, '/orders/detail')
      expect(resolveUrl(req, '../../summary')).toBe(
        '//api.example.com/trading/exchange/v1/summary'
      )
    })
    it('walks up into prefix', () => {
      const req = mockRequest()
      expect(resolveUrl(req, '../../summary')).toBe(
        '//api.example.com/trading/exchange/summary'
      )
    })
    it('walks up to root when traversal exceeds path depth', () => {
      const req = mockRequest()
      expect(resolveUrl(req, '../../../../../summary')).toBe(
        '//api.example.com/summary'
      )
    })
    it('handles ../ with nested target path', () => {
      const req = mockRequest()
      expect(resolveUrl(req, '../health/ping')).toBe(
        '//api.example.com/trading/exchange/v1/health/ping'
      )
    })
    it('strips query string from originalUrl before walking up', () => {
      const req = mockRequest({}, '/orders?page=1')
      expect(resolveUrl(req, '../ping')).toBe(
        '//api.example.com/trading/exchange/v1/ping'
      )
    })
  })

  describe('originalUrl edge cases', () => {
    it('handles originalUrl as root', () => {
      const req = mockRequest({}, '/')
      expect(resolveUrl(req, './foo')).toBe(
        '//api.example.com/trading/exchange/v1/foo'
      )
    })
    it('handles originalUrl with no prefix', () => {
      const req = mockRequest({ 'x-forwarded-prefix': undefined }, '/orders')
      expect(resolveUrl(req, './detail')).toBe(
        '//api.example.com/orders/detail'
      )
    })
  })

  describe('implicit protocol', () => {
    it('always begins with //', () => {
      const req = mockRequest()
      expect(resolveUrl(req, '/foo')).toBe(
        '//api.example.com/trading/exchange/v1/foo'
      )
    })
    it('never includes http scheme', () => {
      const req = mockRequest()
      expect(resolveUrl(req, '/foo').startsWith('http://')).toBe(false)
    })
    it('never includes https scheme', () => {
      const req = mockRequest()
      expect(resolveUrl(req, '/foo').startsWith('https://')).toBe(false)
    })
  })
})
