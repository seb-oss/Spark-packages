import { describe, expect, it } from 'vitest'
import { parsePath } from './parse-path'

describe('parsePath', () => {
  it('parses operation and index from a standard path', () => {
    expect(parsePath('/my_index/_search')).toEqual({
      index: 'my_index',
      operation: 'search',
    })
  })

  it('parses operation with no index for root-level operations', () => {
    expect(parsePath('/_bulk')).toEqual({ operation: 'bulk' })
  })

  it('parses operation with no index for _cat paths', () => {
    expect(parsePath('/_cat/indices')).toEqual({ operation: 'cat' })
  })

  it('returns empty object for paths with no operation segment', () => {
    expect(parsePath('/')).toEqual({})
  })

  it('returns empty object for a plain index path with no method', () => {
    expect(parsePath('/my_index')).toEqual({})
  })

  it('returns indices.create for PUT on a plain index path', () => {
    expect(parsePath('/my_index', 'PUT')).toEqual({
      operation: 'indices.create',
      index: 'my_index',
    })
  })

  it('returns indices.delete for DELETE on a plain index path', () => {
    expect(parsePath('/my_index', 'DELETE')).toEqual({
      operation: 'indices.delete',
      index: 'my_index',
    })
  })

  it('returns indices.delete for DELETE on a wildcard path', () => {
    expect(parsePath('/*,-.*', 'DELETE')).toEqual({
      operation: 'indices.delete',
      index: '*,-.*',
    })
  })

  it('does not treat paths starting with _ as index names', () => {
    const result = parsePath('/_search')
    expect(result.index).toBeUndefined()
    expect(result.operation).toBe('search')
  })

  it('handles multi-segment index names', () => {
    expect(parsePath('/news_v0.1.1/_search')).toEqual({
      index: 'news_v0.1.1',
      operation: 'search',
    })
  })

  it('maps _doc to operation "index"', () => {
    expect(parsePath('/my_index/_doc')).toEqual({
      index: 'my_index',
      operation: 'index',
    })
  })
})
