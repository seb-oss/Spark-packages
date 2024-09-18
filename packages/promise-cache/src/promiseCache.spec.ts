import { afterEach } from 'node:test'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { PromiseCache, clean } from './index'

vi.mock('redis')

const REDIS_URL = {
  url: 'redis://127.0.0.1:6379',
}

const ttl = 1
const cache: PromiseCache<number> = new PromiseCache<number>({
  redis: REDIS_URL,
  ttlInSeconds: ttl,
  caseSensitive: false,
})
const caseSensitiveCache = new PromiseCache<number>({
  redis: REDIS_URL,
  ttlInSeconds: ttl,
  caseSensitive: true,
})

describe('PromiseCache', () => {
  afterAll(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  beforeAll(() => {
    console.error = vi.fn()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  beforeEach(() => {
    clean()
    // @ts-ignore
    cache.persistor.client.clear()
    // @ts-ignore
    caseSensitiveCache.persistor.client.clear()
  })

  afterEach(() => {
    vi.runAllTimers()
  })

  it('should cache and return the result', async () => {
    const mockDelegate = vi.fn()
    mockDelegate.mockResolvedValue(42)
    const result = await cache.wrap('testKey0', mockDelegate)

    expect(await cache.size()).toBe(1)
    expect(result).toBe(42)
    expect(mockDelegate).toHaveBeenCalledTimes(1)

    // Call again with the same key, should not call mockDelegate again
    const cachedResult = await cache.wrap('testKey0', mockDelegate)

    vi.runAllTimers()
    expect(cachedResult).toBe(42)
    expect(mockDelegate).toHaveBeenCalledTimes(1)
  })

  it('cache should expire after ttl', async () => {
    const mockDelegate = vi.fn()
    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey1', mockDelegate)

    // Wait for the cache to expire
    vi.runAllTimers()

    // Call again, should call mockDelegate again
    await cache.wrap('testKey1', mockDelegate)
    expect(mockDelegate).toHaveBeenCalledTimes(2)
  })

  it('should remove the cache entry after the TTL expires', async () => {
    const delegate = vi.fn().mockResolvedValue(42)
    const mCache = new PromiseCache<number>({
      redis: REDIS_URL,
      ttlInSeconds: ttl,
    })
    await mCache.wrap('testKey1', delegate)
    expect(await mCache.size()).toBe(1)

    await mCache.wrap('testKey2', delegate, 0.5)
    expect(await mCache.size()).toBe(2)

    vi.runAllTimers()
    expect(await mCache.size()).toBe(0)
  })

  it('calling wrap with different ttls yields unexpected behavior', async () => {
    const mockDelegate = vi.fn()
    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey', mockDelegate, 1)
    expect(await cache.size()).toBe(1)

    // Update the TTL to 2 seconds
    await cache.wrap('testKey', mockDelegate, 2)

    // Expect a warning message.
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(
      'WARNING: TTL mismatch for key: testkey. It is recommended to use the same TTL for the same key.'
    )
    expect(await cache.size()).toBe(1)

    // Wait for the first cache to expire
    vi.runAllTimers()

    // Cache is already expired!
    expect(await cache.size()).toBe(0)
  })

  it('should throw an exception if the delegate throws an error', async () => {
    const mockDelegate = vi.fn()
    const cache = new PromiseCache<number>({
      redis: REDIS_URL,
      ttlInSeconds: ttl,
    })

    const errorMessage = 'Error in delegate function'
    mockDelegate.mockRejectedValue(new Error(errorMessage))

    // Expect the cache wrapper to throw the same error
    await expect(cache.wrap('testKey2', mockDelegate)).rejects.toThrow(
      errorMessage
    )
  })

  it('should respect custom ttl if provided', async () => {
    const mockDelegate = vi.fn()
    const localTTL = 0.5 // 0.5 second TTL

    mockDelegate.mockResolvedValue(42)
    await cache.wrap('testKey3', mockDelegate, localTTL)

    // Wait for the custom TTL to expire
    vi.runAllTimers()

    // Call again with the same key, should call mockDelegate again due to expired custom TTL
    await cache.wrap('testKey3', mockDelegate, localTTL)
    expect(mockDelegate).toHaveBeenCalledTimes(2)
  })

  it('should not differentiate between keys with different casing', async () => {
    const mockDelegate1 = vi.fn()
    const mockDelegate2 = vi.fn()
    mockDelegate1.mockResolvedValue(41)
    mockDelegate2.mockResolvedValue(42)
    const key1 = 'TeStKeYs'
    const key2 = 'testkeys'
    const value1 = await cache.wrap(key1, mockDelegate1)
    const value2 = await cache.wrap(key2, mockDelegate2)
    expect(value1 === value2).toBeTruthy()
  })

  it('should not differentiate between keys with different casing', async () => {
    const mockDelegate1 = vi.fn()
    const mockDelegate2 = vi.fn()
    mockDelegate1.mockResolvedValue(30)
    mockDelegate2.mockResolvedValue(42)
    const key1 = 'TeStKeYs'
    const key2 = 'testkeys'
    const value1 = await caseSensitiveCache.wrap(key1, mockDelegate1)
    const value2 = await caseSensitiveCache.wrap(key2, mockDelegate2)
    expect(value1 === value2).toBeFalsy()
  })

  it('should share memory between PromiseCache instances', async () => {
    const localCache1 = new PromiseCache<number>({
      redis: REDIS_URL,
      ttlInSeconds: ttl,
      caseSensitive: false,
    })
    const localCache2 = new PromiseCache<number>({
      redis: REDIS_URL,
      ttlInSeconds: ttl,
      caseSensitive: false,
    })

    await localCache1.override('test1', 100)
    await localCache1.override('test2', 200)
    await localCache1.override('test3', 300)

    await localCache2.override('test4', 400)
    await localCache2.override('test5', 500)
    await localCache2.override('test6', 600)

    const value1 = await localCache2.find('test1')
    const value2 = await localCache2.find('test2')
    const value3 = await localCache2.find('test3')

    const value4 = await localCache1.find('test4')
    const value5 = await localCache1.find('test5')
    const value6 = await localCache1.find('test6')

    expect(value1).toBe(100)
    expect(value2).toBe(200)
    expect(value3).toBe(300)

    expect(value4).toBe(400)
    expect(value5).toBe(500)
    expect(value6).toBe(600)
  })

  it('should call onSuccess callback', async () => {
    const successSpy = vi.fn()
    const localCache10 = new PromiseCache<number>({
      redis: REDIS_URL,
      ttlInSeconds: ttl,
      caseSensitive: false,
      onSuccess: successSpy,
    })

    expect(successSpy).toHaveBeenCalledOnce()
  })
})
