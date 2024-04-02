import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { PromiseCache } from './promiseCache'

describe('PromiseCache', () => {
  const ttl = 1

  let cache: PromiseCache<string, number>
  let caseSensitiveCache: PromiseCache<string, number>
  let mockDelegate: vi.Mock<Promise<number>, []>

  afterAll(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  beforeAll(() => {
    console.error = vi.fn()
    vi.useFakeTimers()
  })

  beforeEach(() => {
    cache = new PromiseCache<string, number>(ttl)
    caseSensitiveCache = new PromiseCache<string, number>(ttl, true)
    mockDelegate = vi.fn()
  })

  it('should cache and return the result', async () => {
    mockDelegate.mockResolvedValue(42)
    const result = await cache.wrap('testKey', mockDelegate)

    expect(cache.size()).toBe(1)
    expect(result).toBe(42)
    expect(mockDelegate).toHaveBeenCalledTimes(1)

    // Call again with the same key, should not call mockDelegate again
    const cachedResult = await cache.wrap('testKey', mockDelegate)

    vi.runAllTimers()
    expect(cache.size()).toBe(0)
    expect(cachedResult).toBe(42)
    expect(mockDelegate).toHaveBeenCalledTimes(1)
  })

  it('cache should expire after ttl', async () => {
    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey', mockDelegate)

    // Wait for the cache to expire
    vi.runAllTimers()

    // Call again, should call mockDelegate again
    await cache.wrap('testKey', mockDelegate)
    expect(mockDelegate).toHaveBeenCalledTimes(2)
  })

  it('should throw an exception if the delegate throws an error', async () => {
    const errorMessage = 'Error in delegate function'
    mockDelegate.mockRejectedValue(new Error(errorMessage))

    // Expect the cache wrapper to throw the same error
    await expect(cache.wrap('testKey', mockDelegate)).rejects.toThrow(
      errorMessage
    )
  })

  it('should respect custom ttl if provided', async () => {
    const localTTL = 0.5 // 0.5 second TTL

    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey', mockDelegate, localTTL)

    // Wait for the custom TTL to expire
    vi.runAllTimers()

    // Call again with the same key, should call mockDelegate again due to expired custom TTL
    await cache.wrap('testKey', mockDelegate, localTTL)
    expect(mockDelegate).toHaveBeenCalledTimes(2)
  })

  it('should should remove the cache entry after the TTL expires', async () => {
    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey', mockDelegate)
    expect(cache.size()).toBe(1)

    await cache.wrap('testKey2', mockDelegate, 0.5)
    expect(cache.size()).toBe(2)

    // Wait for the caches to expire.
    vi.advanceTimersToNextTimer()
    expect(cache.size()).toBe(1)

    vi.advanceTimersToNextTimer()
    expect(cache.size()).toBe(0)
  })

  it('calling wrap with different ttls yields unexpected behavior', async () => {
    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey', mockDelegate, 1)
    expect(cache.size()).toBe(1)

    // Update the TTL to 2 seconds
    await cache.wrap('testKey', mockDelegate, 2)

    // Expect a warning message.
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(
      'WARNING: TTL mismatch for key: testkey. It is recommended to use the same TTL for the same key.'
    )

    expect(cache.size()).toBe(1)

    // Wait for the first cache to expire
    vi.runAllTimers()

    // Cache is already expired!
    expect(cache.size()).toBe(0)
  })

  it('should differentiate between keys with different casing', async () => {
    mockDelegate.mockResolvedValue(42)

    const key1 = 'TeStKeY'
    const key2 = 'testkey'

    await cache.wrap(key1, mockDelegate)
    await cache.wrap(key2, mockDelegate)
    expect(cache.size()).toBe(1)

    await caseSensitiveCache.wrap(key1, mockDelegate)
    await caseSensitiveCache.wrap(key2, mockDelegate)
    expect(caseSensitiveCache.size()).toBe(2)
  })
})
