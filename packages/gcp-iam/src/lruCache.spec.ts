import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LruCache } from './lruCache'

describe('LruCache', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns undefined for a key that was never set', () => {
    const cache = new LruCache<string>()
    expect(cache.get('missing')).toBeUndefined()
  })

  it('returns the value for a fresh entry', () => {
    const cache = new LruCache<string>({ ttl: 1000 })
    cache.put('k', 'v')
    expect(cache.get('k')).toBe('v')
  })

  it('returns undefined and removes entry after TTL expires', () => {
    const cache = new LruCache<string>({ ttl: 500 })
    cache.put('k', 'val')
    vi.advanceTimersByTime(501)
    expect(cache.get('k')).toBeUndefined()
  })

  it('evicts the least-recently-used entry when maxEntries is reached', () => {
    const cache = new LruCache<number>({ maxEntries: 2 })
    cache.put('a', 1)
    cache.put('b', 2)
    // 'a' is LRU — adding 'c' should evict it
    cache.put('c', 3)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('c')).toBe(3)
  })

  it('clears a specific entry', () => {
    const cache = new LruCache<string>()
    cache.put('k', 'v')
    cache.clear('k')
    expect(cache.get('k')).toBeUndefined()
  })
})
