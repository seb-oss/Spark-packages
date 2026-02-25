import type { Request } from 'express'
import { beforeEach, describe, expect, it } from 'vitest'
import { toEntity } from './entity'
import type { Link } from './types'

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

describe('toEntity', () => {
  describe('self link', () => {
    it('always includes a self link with GET method', () => {
      const req = mockRequest()
      const entity = toEntity(req, { foo: 'bar' })
      expect(entity.links.self).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders',
      })
    })
    it('self link preserves query string', () => {
      const req = mockRequest({}, '/orders?page=1&limit=10')
      const entity = toEntity(req, { foo: 'bar' })
      expect(entity.links.self).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?page=1&limit=10',
      })
    })
    it('self link is overridden by passed links', () => {
      const req = mockRequest()
      const links: Record<string, Link> = {
        self: { method: 'GET', href: '/something/else' },
      }
      const entity = toEntity(req, { foo: 'bar' }, links)
      expect(entity.links.self).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/something/else',
      })
    })
  })

  describe('data', () => {
    it('includes the passed object data', () => {
      const req = mockRequest()
      const data = { foo: 'bar', baz: 42 }
      expect(toEntity(req, data)).toEqual({
        data: { foo: 'bar', baz: 42 },
        links: {
          self: {
            method: 'GET',
            href: '//api.example.com/trading/exchange/v1/orders',
          },
        },
      })
    })
    it('handles primitive data', () => {
      const req = mockRequest()
      expect(toEntity(req, 42)).toEqual({
        data: 42,
        links: {
          self: {
            method: 'GET',
            href: '//api.example.com/trading/exchange/v1/orders',
          },
        },
      })
    })
    it('handles array data', () => {
      const req = mockRequest()
      expect(toEntity(req, [{ id: 1 }, { id: 2 }])).toEqual({
        data: [{ id: 1 }, { id: 2 }],
        links: {
          self: {
            method: 'GET',
            href: '//api.example.com/trading/exchange/v1/orders',
          },
        },
      })
    })
    it('handles null data', () => {
      const req = mockRequest()
      expect(toEntity(req, null)).toEqual({
        data: null,
        links: {
          self: {
            method: 'GET',
            href: '//api.example.com/trading/exchange/v1/orders',
          },
        },
      })
    })
  })

  describe('links', () => {
    let req: Request
    beforeEach(() => {
      req = mockRequest()
    })
    it('resolves absolute link href', () => {
      const links: Record<string, Link> = {
        parent: { method: 'GET', href: '/health' },
      }
      expect(toEntity(req, {}, links).links).toEqual({
        self: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
        parent: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/health',
        },
      })
    })
    it('resolves relative link href', () => {
      const links: Record<string, Link> = {
        detail: { method: 'GET', href: './detail' },
      }
      expect(toEntity(req, {}, links).links).toEqual({
        self: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
        detail: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/orders/detail',
        },
      })
    })
    it('resolves parent link href', () => {
      const links: Record<string, Link> = {
        parent: { method: 'GET', href: '../' },
      }
      expect(toEntity(req, {}, links).links).toEqual({
        self: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
        parent: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/',
        },
      })
    })
    it('handles multiple links with mixed methods', () => {
      const links: Record<string, Link> = {
        parent: { method: 'GET', href: '../health' },
        create: { method: 'POST', href: '/orders' },
        update: { method: 'PUT', href: './orders' },
      }
      expect(toEntity(req, {}, links).links).toEqual({
        self: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
        parent: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/health',
        },
        create: {
          method: 'POST',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
        update: {
          method: 'PUT',
          href: '//api.example.com/trading/exchange/v1/orders/orders',
        },
      })
    })
    it('handles empty links', () => {
      expect(toEntity(req, {}).links).toEqual({
        self: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
      })
    })
  })

  describe('string link shorthand', () => {
    let req: Request
    beforeEach(() => {
      req = mockRequest()
    })
    it('resolves a string link as GET', () => {
      expect(toEntity(req, {}, { parent: '/health' }).links).toEqual({
        self: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
        parent: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/health',
        },
      })
    })
    it('resolves mixed string and Link records', () => {
      expect(
        toEntity(
          req,
          {},
          {
            parent: '/health',
            create: { method: 'POST', href: '/orders' },
          }
        ).links
      ).toEqual({
        self: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
        parent: {
          method: 'GET',
          href: '//api.example.com/trading/exchange/v1/health',
        },
        create: {
          method: 'POST',
          href: '//api.example.com/trading/exchange/v1/orders',
        },
      })
    })
  })
})
