import type { Request } from 'express'
import { describe, expect, it } from 'vitest'
import { toCursorListEntity } from './cursor-list'
import { toEntity } from './entity'
import type { Entity } from './types'

interface TestItem {
  id: number
  name: string
}

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

const items: TestItem[] = [
  { id: 1, name: 'Order 1' },
  { id: 2, name: 'Order 2' },
  { id: 3, name: 'Order 3' },
]

const mappedItems: Entity<TestItem>[] = items.map((item) =>
  toEntity(mockRequest(), item, { self: `./orders/${item.id}` })
)

describe('toCursorListEntity', () => {
  describe('data', () => {
    it('includes pre-mapped items', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.data).toEqual(mappedItems)
    })
    it('handles empty data', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, [], 10)
      expect(entity.data).toEqual([])
    })
  })

  describe('meta', () => {
    it('includes pageSize and nextCursor', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity._meta).toEqual({ pageSize: 10, nextCursor: 'next-abc' })
    })
    it('includes pageSize, nextCursor and prevCursor', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(
        req,
        mappedItems,
        10,
        'next-abc',
        'prev-abc'
      )
      expect(entity._meta).toEqual({
        pageSize: 10,
        nextCursor: 'next-abc',
        prevCursor: 'prev-abc',
      })
    })
    it('includes only pageSize when no cursors', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, mappedItems, 10)
      expect(entity._meta).toEqual({ pageSize: 10 })
    })
  })

  describe('self link', () => {
    it('constructs self link from request', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.self).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders',
      })
    })
    it('self link preserves existing query params', () => {
      const req = mockRequest({}, '/orders?status=active')
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.self).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active',
      })
    })
  })

  describe('first link', () => {
    it('strips cursor params from current url', () => {
      const req = mockRequest({}, '/orders?next_cursor=abc&page_size=10')
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.first).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders',
      })
    })
    it('preserves non-cursor query params', () => {
      const req = mockRequest({}, '/orders?status=active&next_cursor=abc')
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.first).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active',
      })
    })
    it('preserves multiple non-cursor query params', () => {
      const req = mockRequest(
        {},
        '/orders?status=active&type=fund&next_cursor=abc&prev_cursor=xyz'
      )
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.first).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&type=fund',
      })
    })
  })

  describe('next link', () => {
    it('is absent when nextCursor is not provided', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, mappedItems, 10)
      expect(entity.links.next).toBeUndefined()
    })
    it('is absent when nextCursor is undefined', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, mappedItems, 10, undefined)
      expect(entity.links.next).toBeUndefined()
    })
    it('includes next_cursor query param', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.next).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?next_cursor=next-abc&page_size=10',
      })
    })
    it('preserves existing query params', () => {
      const req = mockRequest({}, '/orders?status=active')
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.next).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&next_cursor=next-abc&page_size=10',
      })
    })
    it('replaces existing next_cursor query param', () => {
      const req = mockRequest({}, '/orders?next_cursor=old&status=active')
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.next).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&next_cursor=next-abc&page_size=10',
      })
    })
  })

  describe('prev link', () => {
    it('is absent when prevCursor is not provided', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.prev).toBeUndefined()
    })
    it('is absent when prevCursor is undefined', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(
        req,
        mappedItems,
        10,
        'next-abc',
        undefined
      )
      expect(entity.links.prev).toBeUndefined()
    })
    it('includes prev_cursor query param', () => {
      const req = mockRequest()
      const entity = toCursorListEntity(
        req,
        mappedItems,
        10,
        'next-abc',
        'prev-abc'
      )
      expect(entity.links.prev).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?prev_cursor=prev-abc&page_size=10',
      })
    })
    it('preserves existing query params', () => {
      const req = mockRequest({}, '/orders?status=active')
      const entity = toCursorListEntity(
        req,
        mappedItems,
        10,
        'next-abc',
        'prev-abc'
      )
      expect(entity.links.prev).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&prev_cursor=prev-abc&page_size=10',
      })
    })
    it('replaces existing prev_cursor query param', () => {
      const req = mockRequest({}, '/orders?prev_cursor=old&status=active')
      const entity = toCursorListEntity(
        req,
        mappedItems,
        10,
        'next-abc',
        'prev-abc'
      )
      expect(entity.links.prev).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&prev_cursor=prev-abc&page_size=10',
      })
    })
  })

  describe('query param merging', () => {
    it('preserves multiple filters on next link', () => {
      const req = mockRequest(
        {},
        '/orders?status=active&type=fund&category=equity'
      )
      const entity = toCursorListEntity(req, mappedItems, 10, 'next-abc')
      expect(entity.links.next).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&type=fund&category=equity&next_cursor=next-abc&page_size=10',
      })
    })
    it('preserves multiple filters on prev link', () => {
      const req = mockRequest(
        {},
        '/orders?status=active&type=fund&category=equity'
      )
      const entity = toCursorListEntity(
        req,
        mappedItems,
        10,
        'next-abc',
        'prev-abc'
      )
      expect(entity.links.prev).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&type=fund&category=equity&prev_cursor=prev-abc&page_size=10',
      })
    })
  })
})
