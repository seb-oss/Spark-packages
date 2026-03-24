import {
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
} from '@opentelemetry/semantic-conventions'
import { describe, expect, it } from 'vitest'
import { extractResponseAttributes } from './response-attributes'

const makeResponse = (overrides: Record<string, unknown> = {}) =>
  ({
    statusCode: 200,
    headers: {},
    warnings: null,
    meta: { connection: { url: new URL('http://opensearch.local:9200') } },
    body: {
      took: 5,
      timed_out: false,
      _shards: { total: 3, successful: 3, failed: 0 },
      hits: { total: { value: 42, relation: 'eq' }, hits: [] },
    },
    ...overrides,
  }) as any

describe('extractResponseAttributes', () => {
  it('sets server.address from the connection url', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs[ATTR_SERVER_ADDRESS]).toBe('opensearch.local')
  })

  it('sets server.port from the connection url', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs[ATTR_SERVER_PORT]).toBe(9200)
  })

  it('omits server.port when url uses the default port', () => {
    const res = makeResponse({
      meta: { connection: { url: new URL('http://opensearch.local') } },
    })
    const attrs = extractResponseAttributes(res)
    expect(attrs[ATTR_SERVER_PORT]).toBeUndefined()
  })

  it('sets http.response.status_code', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['http.response.status_code']).toBe(200)
  })

  it('sets db.opensearch.took', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.took']).toBe(5)
  })

  it('sets db.opensearch.timed_out', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.timed_out']).toBe(false)
  })

  it('sets db.opensearch.shards.total', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.shards.total']).toBe(3)
  })

  it('sets db.opensearch.shards.successful', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.shards.successful']).toBe(3)
  })

  it('sets db.opensearch.shards.failed', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.shards.failed']).toBe(0)
  })

  it('sets db.opensearch.hits.total', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.hits.total']).toBe(42)
  })

  it('omits body-derived attributes when body is null', () => {
    const attrs = extractResponseAttributes(makeResponse({ body: null }))
    expect(attrs['db.opensearch.took']).toBeUndefined()
    expect(attrs['db.opensearch.hits.total']).toBeUndefined()
  })

  it('omits shard attributes when _shards is absent', () => {
    const res = makeResponse({
      body: {
        took: 1,
        timed_out: false,
        hits: { total: { value: 0 }, hits: [] },
      },
    })
    const attrs = extractResponseAttributes(res)
    expect(attrs['db.opensearch.shards.total']).toBeUndefined()
  })

  it('omits hits.total when the value is not a number', () => {
    const res = makeResponse({
      body: { took: 1, hits: { total: null, hits: [] } },
    })
    const attrs = extractResponseAttributes(res)
    expect(attrs['db.opensearch.hits.total']).toBeUndefined()
  })

  it('sets db.opensearch.shards.skipped when present', () => {
    const res = makeResponse({
      body: {
        took: 1,
        timed_out: false,
        _shards: { total: 5, successful: 3, failed: 0, skipped: 2 },
        hits: { total: { value: 0 }, hits: [] },
      },
    })
    const attrs = extractResponseAttributes(res)
    expect(attrs['db.opensearch.shards.skipped']).toBe(2)
  })

  it('omits db.opensearch.shards.skipped when absent', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.shards.skipped']).toBeUndefined()
  })

  it('sets db.opensearch.terminated_early when true', () => {
    const res = makeResponse({
      body: {
        took: 1,
        timed_out: false,
        terminated_early: true,
        _shards: { total: 3, successful: 3, failed: 0 },
        hits: { total: { value: 0 }, hits: [] },
      },
    })
    const attrs = extractResponseAttributes(res)
    expect(attrs['db.opensearch.terminated_early']).toBe(true)
  })

  it('omits db.opensearch.terminated_early when absent', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.terminated_early']).toBeUndefined()
  })

  it('sets db.opensearch.phase_took.* when present', () => {
    const res = makeResponse({
      body: {
        took: 10,
        timed_out: false,
        phase_took: {
          can_match: 1,
          dfs_pre_query: 2,
          dfs_query: 3,
          expand: 4,
          fetch: 5,
          query: 6,
        },
        _shards: { total: 3, successful: 3, failed: 0 },
        hits: { total: { value: 0 }, hits: [] },
      },
    })
    const attrs = extractResponseAttributes(res)
    expect(attrs['db.opensearch.phase_took.can_match']).toBe(1)
    expect(attrs['db.opensearch.phase_took.dfs_pre_query']).toBe(2)
    expect(attrs['db.opensearch.phase_took.dfs_query']).toBe(3)
    expect(attrs['db.opensearch.phase_took.expand']).toBe(4)
    expect(attrs['db.opensearch.phase_took.fetch']).toBe(5)
    expect(attrs['db.opensearch.phase_took.query']).toBe(6)
  })

  it('omits db.opensearch.phase_took.* when phase_took is absent', () => {
    const attrs = extractResponseAttributes(makeResponse())
    expect(attrs['db.opensearch.phase_took.query']).toBeUndefined()
  })
})
