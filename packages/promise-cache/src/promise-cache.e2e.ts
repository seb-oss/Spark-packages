import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'
import { addMilliseconds } from 'date-fns'
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
})
