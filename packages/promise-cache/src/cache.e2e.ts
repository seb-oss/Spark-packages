import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'
import { addMilliseconds } from 'date-fns'
import { createClient } from 'redis'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createCache } from './cache'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('cache e2e', () => {
  let container: StartedRedisContainer
  let cache: ReturnType<typeof createCache>
  let persistor: ReturnType<typeof createClient>

  beforeAll(async () => {
    container = await new RedisContainer().start()
    persistor = createClient({ url: container.getConnectionUrl() })
    await persistor.connect()

    cache = createCache(persistor)
  })

  afterAll(async () => {
    await persistor.quit()
    await container.stop()
  })

  beforeEach(async () => {
    await cache.persistor.flushAll() // Clear cache before each test
  })

  it('returns the same value as the unwrapped function', async () => {
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, { key: 'fixed-key' })

    const result = await wrapped(5)

    expect(result).toBe(10)
  })

  it('stores the result in Redis with a fixed key', async () => {
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, { key: 'fixed-key' })

    await wrapped(5)

    const storedValue = await cache.persistor.get('fixed-key')
    expect(storedValue).toBe('{"json":10}')
  })

  it('stores the result in Redis with a computed key', async () => {
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, { key: (x) => `key-${x}` })

    await wrapped(5)

    const storedValue = await cache.persistor.get('key-5')
    expect(storedValue).toBe('{"json":10}')
  })

  it('stores value with a fixed TTL', async () => {
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, { key: 'fixed-ttl', expiry: 500 }) // 500ms TTL

    await wrapped(5)
    await wait(300) // Wait less than TTL
    const resultBeforeExpiry = await wrapped(5)
    expect(resultBeforeExpiry).toBe(10)

    await wait(300) // Wait past TTL
    const resultAfterExpiry = await wrapped(5)
    expect(resultAfterExpiry).toBe(10)
  })

  it('stores value with a fixed Date expiry', async () => {
    const expiryDate = addMilliseconds(new Date(), 1000) // Ensure expiry is at least 1 second ahead
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, {
      key: 'fixed-date',
      expiry: expiryDate,
    })

    await wrapped(5)
    await wait(800) // Before expiry
    const resultBeforeExpiry = await wrapped(5)
    expect(resultBeforeExpiry).toBe(10)

    await wait(500) // After expiry
    const resultAfterExpiry = await wrapped(5)
    expect(resultAfterExpiry).toBe(10)
  })

  it('stores value with computed TTL based on args and result', async () => {
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, {
      key: 'computed-ttl',
      expiry: (args, result) => args[0] * 100 + result * 10, // Dynamic TTL
    })

    await wrapped(5) // TTL = 5 * 100 + 10 * 10 = 600ms

    await wait(500) // Before expiry
    const resultBeforeExpiry = await wrapped(5)
    expect(resultBeforeExpiry).toBe(10)

    await wait(200) // After expiry
    const resultAfterExpiry = await wrapped(5)
    expect(resultAfterExpiry).toBe(10)
  })

  it('stores value with computed Date expiry based on args and result', async () => {
    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, {
      key: 'computed-date',
      expiry: (args, result) =>
        addMilliseconds(new Date(), args[0] * 100 + result * 10),
    })

    await wrapped(5) // TTL = 5 * 100 + 10 * 10 = 600ms

    await wait(500) // Before expiry
    const resultBeforeExpiry = await wrapped(5)
    expect(resultBeforeExpiry).toBe(10)

    await wait(200) // After expiry
    const resultAfterExpiry = await wrapped(5)
    expect(resultAfterExpiry).toBe(10)
  })

  it('returns cached value instead of calling the delegate', async () => {
    await cache.persistor.set('cached-key', '{"json":20}')

    const delegate = async (x: number) => x * 2
    const wrapped = cache.wrap(delegate, { key: 'cached-key' })

    const result = await wrapped(5)

    expect(result).toBe(20) // Should return cached value
  })

  it('does not store the result if the delegate throws an error', async () => {
    const delegate = async (_x: number) => {
      throw new Error('Something went wrong')
    }
    const wrapped = cache.wrap(delegate, { key: 'error-key' })

    await expect(wrapped(5)).rejects.toThrow('Something went wrong')

    const storedValue = await cache.persistor.get('error-key')
    expect(storedValue).toBeNull()
  })

  it('deduplicates multiple concurrent requests', async () => {
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
