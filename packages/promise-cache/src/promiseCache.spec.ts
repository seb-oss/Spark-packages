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
})
