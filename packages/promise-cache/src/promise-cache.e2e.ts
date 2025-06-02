import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { PromiseCache, type PromiseCacheOptions } from './promiseCache'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('promise-cache', () => {
  let redis: StartedRedisContainer
  let options: PromiseCacheOptions
  beforeAll(async () => {
    redis = await new RedisContainer().start()
    options = { redis: { url: redis.getConnectionUrl() } }
  })
  beforeEach(async () => {
    await redis.executeCliCmd('FLUSHALL')
  })
  afterAll(async () => {
    redis.stop()
  })
  it('works with ttl', async () => {
    const cache = new PromiseCache<number>(options)
    const promise = vi.fn(async () => 42)

    const ttl = 0.2

    const wrapped = () => cache.wrap('the_answer', promise, ttl)

    const result1 = await wrapped()
    const result2 = await wrapped()

    // Returns correct value
    expect(result1).toEqual(42)
    expect(result2).toEqual(42)

    // Caches response
    expect(promise).toHaveBeenCalledTimes(1)

    // Puts response in redis
    const stored = await cache.persistor.get<number>('the_answer')
    expect(stored).toEqual<typeof stored>({
      timestamp: expect.any(Number),
      value: 42,
      ttl,
    })

    // Expire
    await wait(1000 * ttl)
    const result3 = await wrapped()
    expect(result3).toEqual(42)
    expect(promise).toHaveBeenCalledTimes(2)
  })

  it('falls back to wrapped function if Redis goes down during execution and fallbackOnCacheError is enabled', async () => {
    const cache = new PromiseCache<number>({
      ...options,
      fallbackToFunction: true, // Enable fallback
    })

    let timesCalled = 0
    const promise = vi.fn(async () => {
      console.log('Promise function called') // Debug log
      if (timesCalled > 0) return 84
      timesCalled++
      return 42
    })

    const ttl = 120 // 2 minutes TTL
    const wrapped = () => cache.wrap('test', promise, ttl)

    // First call: Redis is up, should cache the result
    const result1 = await wrapped()
    expect(result1).toEqual(42)
    expect(promise).toHaveBeenCalledTimes(1)

    // Mock Redis to simulate failure
    vi.spyOn(cache.persistor, 'get').mockImplementation(async () => {
      throw new Error('Redis unavailable')
    })

    // Second call: Redis is down, should fallback to the wrapped function
    const result2 = await wrapped()
    expect(result2).toEqual(84) // Verify it returns the new value
    expect(promise).toHaveBeenCalledTimes(2) // Function is called again due to fallback
  })
})
