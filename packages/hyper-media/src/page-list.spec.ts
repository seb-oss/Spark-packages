import type { Request } from 'express'
import { describe, expect, it } from 'vitest'
import { toEntity } from './entity'
import { toPageListEntity } from './page-list'
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

describe('toPageListEntity', () => {
  describe('data', () => {
    it('includes pre-mapped items', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.data).toEqual(mappedItems)
    })
    it('handles empty data', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, [], 1, 10, 0)
      expect(entity.data).toEqual([])
    })
  })

  describe('meta', () => {
    it('includes correct meta', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 2, 10, 30)
      expect(entity._meta).toEqual({ page: 2, pageSize: 10, total: 30 })
    })
    it('reflects passed page and pageSize in meta', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 3, 5, 100)
      expect(entity._meta).toEqual({ page: 3, pageSize: 5, total: 100 })
    })
  })

  describe('self link', () => {
    it('constructs self link from request', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.links.self).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders',
      })
    })
    it('self link preserves existing query params', () => {
      const req = mockRequest({}, '/orders?status=active')
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.links.self).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active',
      })
    })
  })

  describe('first link', () => {
    it('always points to page 1', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 3, 10, 30)
      expect(entity.links.first).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?page=1&page_size=10',
      })
    })
    it('preserves existing query params', () => {
      const req = mockRequest({}, '/orders?status=active')
      const entity = toPageListEntity(req, mappedItems, 3, 10, 30)
      expect(entity.links.first).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&page=1&page_size=10',
      })
    })
  })

  describe('last link', () => {
    it('points to last page derived from total and pageSize', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.links.last).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?page=3&page_size=10',
      })
    })
    it('rounds up to last page for uneven total', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 1, 10, 25)
      expect(entity.links.last).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?page=3&page_size=10',
      })
    })
    it('preserves existing query params', () => {
      const req = mockRequest({}, '/orders?status=active')
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.links.last).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&page=3&page_size=10',
      })
    })
  })

  describe('prev link', () => {
    it('is absent on first page', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.links.prev).toBeUndefined()
    })
    it('points to previous page', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 3, 10, 30)
      expect(entity.links.prev).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?page=2&page_size=10',
      })
    })
    it('preserves existing query params', () => {
      const req = mockRequest({}, '/orders?status=active')
      const entity = toPageListEntity(req, mappedItems, 3, 10, 30)
      expect(entity.links.prev).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&page=2&page_size=10',
      })
    })
  })

  describe('next link', () => {
    it('is absent on last page', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 3, 10, 30)
      expect(entity.links.next).toBeUndefined()
    })
    it('is absent when total is 0', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, [], 1, 10, 0)
      expect(entity.links.next).toBeUndefined()
    })
    it('points to next page', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.links.next).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?page=2&page_size=10',
      })
    })
    it('preserves existing query params', () => {
      const req = mockRequest({}, '/orders?status=active')
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.links.next).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&page=2&page_size=10',
      })
    })
    it('is absent on last page with uneven total', () => {
      const req = mockRequest()
      const entity = toPageListEntity(req, mappedItems, 3, 10, 25)
      expect(entity.links.next).toBeUndefined()
    })
  })

  describe('query param merging', () => {
    it('replaces existing page and page_size in query params', () => {
      const req = mockRequest({}, '/orders?page=1&page_size=5&status=active')
      const entity = toPageListEntity(req, mappedItems, 2, 10, 30)
      expect(entity.links.next).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?page=3&page_size=10&status=active',
      })
    })
    it('preserves multiple existing filters', () => {
      const req = mockRequest(
        {},
        '/orders?status=active&type=fund&category=equity'
      )
      const entity = toPageListEntity(req, mappedItems, 1, 10, 30)
      expect(entity.links.next).toEqual({
        method: 'GET',
        href: '//api.example.com/trading/exchange/v1/orders?status=active&type=fund&category=equity&page=2&page_size=10',
      })
    })
  })
})
