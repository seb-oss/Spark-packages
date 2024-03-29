import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PromiseCache } from './promiseCache'

describe('PromiseCache', () => {
  let cache: PromiseCache<string, number>
  let mockDelegate: vi.Mock<Promise<number>, []>

  beforeEach(() => {
    cache = new PromiseCache<string, number>(1) // 1 second TTL
    mockDelegate = vi.fn()
  })

  it('should cache and return the result', async () => {
    mockDelegate.mockResolvedValue(42)
    const result = await cache.wrap('testKey', mockDelegate)
    expect(result).toBe(42)
    expect(mockDelegate).toHaveBeenCalledTimes(1)

    // Call again with the same key, should not call mockDelegate again
    const cachedResult = await cache.wrap('testKey', mockDelegate)
    expect(cachedResult).toBe(42)
    expect(mockDelegate).toHaveBeenCalledTimes(1)
  })

  it('cache should expire after ttl', async () => {
    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey', mockDelegate)

    // Wait for the cache to expire
    await new Promise((resolve) => setTimeout(resolve, 1100))

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
    await new Promise((resolve) => setTimeout(resolve, 600))

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
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(cache.size()).toBe(1)

    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(cache.size()).toBe(0)
  })

  it('calling wrap with different ttls yields unexpected behavior', async () => {
    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey', mockDelegate, 1)
    expect(cache.size()).toBe(1)

    // Update the TTL to 2 seconds
    await cache.wrap('testKey', mockDelegate, 2)
    expect(cache.size()).toBe(1)

    // Wait for the first cache to expire
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Cache is already expired!
    expect(cache.size()).toBe(0)
  })
})
