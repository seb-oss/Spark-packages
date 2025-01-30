import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCache } from './cache'
import { InMemoryPersistor } from './inMemoryPersistor'
import type { Cache, IPersistor } from './types'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('cache', () => {
  let persistor: IPersistor
  let cache: Cache

  beforeEach(() => {
    vi.useFakeTimers()
    persistor = new InMemoryPersistor()
    cache = createCache(persistor)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the same value as the unwrapped function', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, { key: 'fixed-key' })

    const result = await wrapped(5)

    expect(result).toBe(10)
    expect(delegate).toHaveBeenCalledOnce()
    expect(delegate).toHaveBeenCalledWith(5)
  })

  it('stores the result in the persistor with a fixed key', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, { key: 'fixed-key' })

    await wrapped(5)

    const storedValue = await persistor.get('fixed-key')
    expect(storedValue).toBe('{"json":10}')
  })

  it('stores the result in the persistor with a computed key', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, { key: (x) => `key-${x}` })

    await wrapped(5)

    const storedValue = await persistor.get('key-5')
    expect(storedValue).toBe('{"json":10}')
  })

  it('stores value without prefix when prefix is undefined', async () => {
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, { key: 'basic-key' })

    await wrapped(5)

    const storedValue = await persistor.get('basic-key')
    expect(storedValue).toBe('{"json":10}')
  })

  it('stores value with prefix when provided', async () => {
    cache = createCache(persistor, 'cache')
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, { key: 'basic-key' })

    await wrapped(5)

    const storedValue = await persistor.get('cache:basic-key')
    expect(storedValue).toBe('{"json":10}')
  })

  it('applies prefix when key is computed from function', async () => {
    cache = createCache(persistor, 'user')
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, { key: (x) => `dynamic-${x}` })

    await wrapped(5)

    const storedValue = await persistor.get('user:dynamic-5')
    expect(storedValue).toBe('{"json":10}')
  })

  it('returns cached value instead of calling the delegate', async () => {
    await persistor.set('cached-key', '{"json":20}')

    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, { key: 'cached-key' })

    const result = await wrapped(5)

    expect(result).toBe(20)
    expect(delegate).not.toHaveBeenCalled()
  })

  it('does not store the result if the delegate throws an error', async () => {
    const delegate = vi.fn(async (_x: number) => {
      throw new Error('Something went wrong')
    })
    const wrapped = cache.wrap(delegate, { key: 'error-key' })

    await expect(wrapped(5)).rejects.toThrow('Something went wrong')

    const storedValue = await persistor.get('error-key')
    expect(storedValue).toBeNull()
  })

  it('caches value with no expiry for 1 second', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, { key: 'no-expiry' })

    await wrapped(5)

    vi.advanceTimersByTime(1000) // Fast forward time (should not expire)

    const result = await wrapped(5)
    expect(result).toBe(10)
    expect(delegate).toHaveBeenCalledTimes(2) // Cache expired
  })

  it('caches value with invalid expiry for 1 second', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, {
      key: 'no-expiry',
      expiry: new Date('invalid'),
    })

    await wrapped(5)

    vi.advanceTimersByTime(1000) // Fast forward time (should not expire)

    const result = await wrapped(5)
    expect(result).toBe(10)
    expect(delegate).toHaveBeenCalledTimes(2) // Cache expired
  })

  it('caches value with fixed TTL (milliseconds)', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, { key: 'fixed-ttl', expiry: 5000 }) // 5 sec expiry

    await wrapped(5)
    vi.advanceTimersByTime(4000) // Fast forward less than expiry time

    const resultBeforeExpiry = await wrapped(5)
    expect(resultBeforeExpiry).toBe(10)
    expect(delegate).toHaveBeenCalledOnce() // Still cached

    vi.advanceTimersByTime(2000) // Now past expiry time

    const resultAfterExpiry = await wrapped(5)
    expect(resultAfterExpiry).toBe(10)
    expect(delegate).toHaveBeenCalledTimes(2) // Cache expired, so called again
  })

  it('caches value with fixed Date expiry', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const expiryDate = new Date(Date.now() + 5000) // 5 sec from now
    const wrapped = cache.wrap(delegate, {
      key: 'fixed-date',
      expiry: expiryDate,
    })

    await wrapped(5)

    vi.advanceTimersByTime(4000) // Fast forward less than expiry time

    const resultBeforeExpiry = await wrapped(5)
    expect(resultBeforeExpiry).toBe(10)
    expect(delegate).toHaveBeenCalledOnce() // Still cached

    vi.advanceTimersByTime(2000) // Now past expiry time

    const resultAfterExpiry = await wrapped(5)
    expect(resultAfterExpiry).toBe(10)
    expect(delegate).toHaveBeenCalledTimes(2) // Cache expired, so called again
  })

  it('caches value with computed TTL based on args and result', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, {
      key: 'computed-ttl',
      expiry: (args, result) => args[0] * 1000 + result * 100, // Dynamic TTL
    })

    await wrapped(5) // TTL = 5 * 1000 + 10 * 100 = 6000ms

    vi.advanceTimersByTime(5000) // Fast forward less than expiry time

    const resultBeforeExpiry = await wrapped(5)
    expect(resultBeforeExpiry).toBe(10)
    expect(delegate).toHaveBeenCalledOnce() // Still cached

    vi.advanceTimersByTime(2000) // Now past expiry time

    const resultAfterExpiry = await wrapped(5)
    expect(resultAfterExpiry).toBe(10)
    expect(delegate).toHaveBeenCalledTimes(2) // Cache expired, so called again
  })

  it('caches value with computed Date expiry based on args and result', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, {
      key: 'computed-date',
      expiry: (args, result) =>
        new Date(Date.now() + args[0] * 1000 + result * 100),
    })

    await wrapped(5) // TTL = 5 sec + 1 sec = expires in 6 sec

    vi.advanceTimersByTime(5000) // Fast forward less than expiry time

    const resultBeforeExpiry = await wrapped(5)
    expect(resultBeforeExpiry).toBe(10)
    expect(delegate).toHaveBeenCalledOnce() // Still cached

    vi.advanceTimersByTime(2000) // Now past expiry time

    const resultAfterExpiry = await wrapped(5)
    expect(resultAfterExpiry).toBe(10)
    expect(delegate).toHaveBeenCalledTimes(2) // Cache expired, so called again
  })

  it('deduplicates multiple concurrent requests', async () => {
    vi.useRealTimers()

    const delegate = vi.fn(async (x: number) => {
      await wait(100) // Simulate delay
      return x * 2
    })

    const wrapped = cache.wrap(delegate, { key: 'dedup-key' })

    // Trigger multiple concurrent requests
    const [result1, result2, result3] = await Promise.all([
      wrapped(5),
      wrapped(5),
      wrapped(5),
    ])

    expect(result1).toBe(10)
    expect(result2).toBe(10)
    expect(result3).toBe(10)
    expect(delegate).toHaveBeenCalledOnce() // Delegate should be called only once
  })

  it('removes pending promise after delegate resolves', async () => {
    const delegate = vi.fn(async (x: number) => x * 2)
    const wrapped = cache.wrap(delegate, { key: 'resolve-key' })

    await wrapped(5)
    expect(persistor.get('resolve-key')).resolves.toBe('{"json":10}')

    await wrapped(5) // Cached value should be used
    expect(delegate).toHaveBeenCalledOnce()
  })

  it('removes pending promise after delegate throws', async () => {
    const delegate = vi.fn(async (_x: number) => {
      throw new Error('Delegate Error')
    })
    const wrapped = cache.wrap(delegate, { key: 'error-key' })

    await expect(wrapped(5)).rejects.toThrow('Delegate Error')

    // Retry should call delegate again since the previous attempt failed
    await expect(wrapped(5)).rejects.toThrow('Delegate Error')
    expect(delegate).toHaveBeenCalledTimes(2)
  })
})
