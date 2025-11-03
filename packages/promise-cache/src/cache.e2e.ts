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
    container = await new RedisContainer('redis:8-alpine').start()
    persistor = createClient({ url: container.getConnectionUrl() })
    persistor.connect()

    cache = createCache(persistor)
  }, 60_000)

  afterAll(async () => {
    await persistor.quit()
    await container.stop()
  })

  beforeEach(async () => {
    if (cache.persistor.isReady) {
      await cache.persistor.flushAll() // Clear cache before each test
    }
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
    await expect(persistor.get('resolve-key')).resolves.toBe('{"json":10}')

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

  describe('cache.persistor', () => {
    describe('.set', () => {
      it('stores a value and retrieves it', async () => {
        const result = await cache.persistor.set('key', 'value')
        expect(result).toBe('OK')
        expect(await cache.persistor.get('key')).toBe('value')
      })

      it('overwrites an existing key', async () => {
        await cache.persistor.set('key', 'value1')
        const result = await cache.persistor.set('key', 'value2')
        expect(result).toBe('OK')
        expect(await cache.persistor.get('key')).toBe('value2')
      })
    })

    describe('.get', () => {
      it('retrieves a stored value', async () => {
        await cache.persistor.set('key', 'value')
        expect(await cache.persistor.get('key')).toBe('value')
      })

      it('returns null for a non-existent key', async () => {
        expect(await cache.persistor.get('non-existent-key')).toBeNull()
      })
    })

    describe('.del', () => {
      it('deletes an existing key', async () => {
        await cache.persistor.set('key', 'value')
        const result = await cache.persistor.del('key')
        expect(result).toBe(1) // 1 means key was deleted
        expect(await cache.persistor.get('key')).toBeNull()
      })

      it('returns 0 when deleting a non-existent key', async () => {
        const result = await cache.persistor.del('non-existent-key')
        expect(result).toBe(0) // 0 means key did not exist
      })
    })

    describe('.expire', () => {
      it('sets expiration on an existing key', async () => {
        await cache.persistor.set('expiring-key', 'value')
        const result = await cache.persistor.expire('expiring-key', 1)
        expect(result).toBe(1) // true means expiration was set

        expect(await cache.persistor.get('expiring-key')).toBe('value')

        await wait(1100)
        expect(await cache.persistor.get('expiring-key')).toBeNull()
      })

      it('returns false when trying to expire a non-existent key', async () => {
        expect(await cache.persistor.expire('non-existent-key', 1)).toBe(0)
      })
    })

    describe('.ttl', () => {
      it('returns correct TTL for an expiring key', async () => {
        await cache.persistor.setEx('ttl-key', 2, 'value')

        await wait(1000)
        const ttl = await cache.persistor.ttl('ttl-key')

        expect(ttl).toBeGreaterThan(0)
        expect(ttl).toBeLessThanOrEqual(1)
      })

      it('returns -1 for a key without expiration', async () => {
        await cache.persistor.set('persistent-key', 'value')
        expect(await cache.persistor.ttl('persistent-key')).toBe(-1)
      })

      it('returns -2 for a non-existent key', async () => {
        expect(await cache.persistor.ttl('non-existent-key')).toBe(-2)
      })
    })

    describe('.flushAll', () => {
      it('removes all keys from storage', async () => {
        await cache.persistor.set('key1', 'value1')
        await cache.persistor.set('key2', 'value2')

        await cache.persistor.flushAll()

        expect(await cache.persistor.get('key1')).toBeNull()
        expect(await cache.persistor.get('key2')).toBeNull()
      })
    })

    describe('.setEx', () => {
      it('sets a key with expiration in seconds', async () => {
        const result = await cache.persistor.setEx('key-ex', 1, 'value')
        expect(result).toBe('OK')
        expect(await cache.persistor.get('key-ex')).toBe('value')

        await wait(1100)
        expect(await cache.persistor.get('key-ex')).toBeNull()
      })
    })

    describe('.pSetEx', () => {
      it('sets a key with expiration in milliseconds', async () => {
        const result = await cache.persistor.pSetEx('key-px', 500, 'value')
        expect(result).toBe('OK')
        expect(await cache.persistor.get('key-px')).toBe('value')

        await wait(600)
        expect(await cache.persistor.get('key-px')).toBeNull()
      })
    })

    describe('.setNX', () => {
      it('only sets a key if it does not exist', async () => {
        const firstSet = await cache.persistor.setNX('nx-key', 'first-value')
        expect(firstSet).toBe(1)
        expect(await cache.persistor.get('nx-key')).toBe('first-value')

        const secondSet = await cache.persistor.setNX('nx-key', 'second-value')
        expect(secondSet).toBe(0) // Should not overwrite
        expect(await cache.persistor.get('nx-key')).toBe('first-value')
      })
    })

    describe('.exists', () => {
      it('returns 1 if the key exists', async () => {
        await cache.persistor.set('existing-key', 'value')
        expect(await cache.persistor.exists('existing-key')).toBe(1)
      })

      it('returns 0 if the key does not exist', async () => {
        expect(await cache.persistor.exists('nonexistent-key')).toBe(0)
      })
    })

    describe('.incr / .decr', () => {
      it('increments a key by 1', async () => {
        const response = await cache.persistor.set('counter', '0')
        expect(response).toBe('OK')
        const result = await cache.persistor.incr('counter')
        expect(result).toBe(1)
        expect(await cache.persistor.get('counter')).toBe('1')
      })

      it('decrements a key by 1', async () => {
        const response = await cache.persistor.set('counter', '10')
        expect(response).toBe('OK')
        const result = await cache.persistor.decr('counter')
        expect(result).toBe(9)
        expect(await cache.persistor.get('counter')).toBe('9')
      })

      it('increments a key by a specific amount', async () => {
        const response = await cache.persistor.set('counter', '5')
        expect(response).toBe('OK')
        const result = await cache.persistor.incrBy('counter', 3)
        expect(result).toBe(8)
        expect(await cache.persistor.get('counter')).toBe('8')
      })

      it('decrements a key by a specific amount', async () => {
        const response = await cache.persistor.set('counter', '20')
        expect(response).toBe('OK')
        const result = await cache.persistor.decrBy('counter', 7)
        expect(result).toBe(13)
        expect(await cache.persistor.get('counter')).toBe('13')
      })
    })

    describe('.hSet and .hGet', () => {
      it('stores and retrieves a field in a hash', async () => {
        const result = await cache.persistor.hSet(
          'hash-key',
          'field1',
          'value1'
        )
        expect(result).toBe(1) // 1 means new field added
        const value = await cache.persistor.hGet('hash-key', 'field1')
        expect(value).toBe('value1')
      })
    })

    describe('.lPush and .rPush', () => {
      it('adds elements to the left and right of a list', async () => {
        const lPushResult = await cache.persistor.lPush('list-key', [
          'left1',
          'left2',
        ])
        expect(lPushResult).toBe(2)

        const rPushResult = await cache.persistor.rPush('list-key', [
          'right1',
          'right2',
        ])
        expect(rPushResult).toBe(4)

        const range = await cache.persistor.lRange('list-key', 0, -1)
        expect(range).toEqual(['left2', 'left1', 'right1', 'right2'])
      })
    })

    describe('.lPop and .rPop', () => {
      it('removes and returns elements from a list', async () => {
        await cache.persistor.rPush('pop-key', ['a', 'b', 'c'])

        const left = await cache.persistor.lPop('pop-key')
        expect(left).toBe('a')

        const right = await cache.persistor.rPop('pop-key')
        expect(right).toBe('c')

        const remaining = await cache.persistor.lRange('pop-key', 0, -1)
        expect(remaining).toEqual(['b'])
      })

      it('returns null for a key after all elements are popped from a list', async () => {
        await persistor.rPush('mylist', ['item1']) // Add one item
        await persistor.lPop('mylist') // Remove it

        expect(await persistor.get('mylist')).toBeNull() // Redis would return null
      })
    })

    describe('.sAdd, .sRem, and .sMembers', () => {
      it('adds, removes, and retrieves set members', async () => {
        const sAddResult = await cache.persistor.sAdd('set-key', [
          'one',
          'two',
          'three',
        ])
        expect(sAddResult).toBe(3)

        let members = await cache.persistor.sMembers('set-key')
        expect(members.sort()).toEqual(['one', 'three', 'two'])

        const sRemResult = await cache.persistor.sRem('set-key', 'two')
        expect(sRemResult).toBe(1)

        members = await cache.persistor.sMembers('set-key')
        expect(members.sort()).toEqual(['one', 'three'])
      })
    })

    describe('.zAdd, .zRange, and .zRem', () => {
      it('adds, retrieves, and removes sorted set members', async () => {
        const zAddResult = await cache.persistor.zAdd('sorted-key', [
          { score: 1, value: 'one' },
          { score: 2, value: 'two' },
          { score: 3, value: 'three' },
        ])
        expect(zAddResult).toBe(3)

        const range = await cache.persistor.zRange('sorted-key', 0, -1)
        expect(range).toEqual(['one', 'two', 'three'])

        const zRemResult = await cache.persistor.zRem('sorted-key', 'two')
        expect(zRemResult).toBe(1)

        const updatedRange = await cache.persistor.zRange('sorted-key', 0, -1)
        expect(updatedRange).toEqual(['one', 'three'])
      })
    })

    describe('.multi', () => {
      it('executes multiple set operations in a batch', async () => {
        const multi = cache.persistor.multi()
        multi.set('key1', 'value1')
        multi.set('key2', 'value2')
        await multi.exec()

        expect(await cache.persistor.get('key1')).toBe('value1')
        expect(await cache.persistor.get('key2')).toBe('value2')
      })

      it('executes multiple setEx operations in a batch', async () => {
        const multi = cache.persistor.multi()
        multi.setEx('expiring-key', 1, 'value')
        await multi.exec()

        expect(await cache.persistor.get('expiring-key')).toBe('value')

        await wait(1100)
        expect(await cache.persistor.get('expiring-key')).toBeNull()
      })

      it('executes multiple pSetEx operations in a batch', async () => {
        const multi = cache.persistor.multi()
        multi.pSetEx('p-expiring-key1', 500, 'value1')
        multi.pSetEx('p-expiring-key2', 1000, 'value2')

        const results = await multi.exec()
        expect(results).toEqual(['OK', 'OK'])

        expect(await cache.persistor.get('p-expiring-key1')).toBe('value1')
        expect(await cache.persistor.get('p-expiring-key2')).toBe('value2')

        await wait(600)
        expect(await cache.persistor.get('p-expiring-key1')).toBeNull()
        expect(await cache.persistor.get('p-expiring-key2')).toBe('value2')

        await wait(500)
        expect(await cache.persistor.get('p-expiring-key2')).toBeNull()
      })

      it('executes multiple setNX operations in a batch', async () => {
        const multi = cache.persistor.multi()
        multi.setNX('nx-key1', 'value1')
        multi.setNX('nx-key1', 'value2') // Should fail
        multi.setNX('nx-key2', 'value3')

        const results = await multi.exec()

        expect(results).toEqual([1, 0, 1]) // true (set), false (failed to overwrite), true (set)
        expect(await cache.persistor.get('nx-key1')).toBe('value1')
        expect(await cache.persistor.get('nx-key2')).toBe('value3')
      })

      it('executes multiple del operations in a batch', async () => {
        await cache.persistor.set('key1', 'value1')
        await cache.persistor.set('key2', 'value2')

        const multi = cache.persistor.multi()
        multi.del('key1')
        multi.del('key2')
        const results = await multi.exec()

        expect(results).toEqual([1, 1])
        expect(await cache.persistor.get('key1')).toBeNull()
        expect(await cache.persistor.get('key2')).toBeNull()
      })

      it('executes multiple exists operations in a batch', async () => {
        await cache.persistor.set('existing-key', 'value')

        const multi = cache.persistor.multi()
        multi.exists('existing-key')
        multi.exists('non-existent-key')
        const results = await multi.exec()

        expect(results).toEqual([1, 0]) // 1 for existing key, 0 for non-existent key
      })

      it('executes multiple incr operations in a batch', async () => {
        await cache.persistor.set('counter', '5')

        const multi = cache.persistor.multi()
        multi.incr('counter')
        multi.incr('counter')
        const results = await multi.exec()

        expect(results).toEqual([6, 7]) // Counter increments from 5 -> 6 -> 7
      })

      it('executes multiple incrBy operations in a batch', async () => {
        await cache.persistor.set('counter', '10')

        const multi = cache.persistor.multi()
        multi.incrBy('counter', 3)
        multi.incrBy('counter', 5)
        const results = await multi.exec()

        expect(results).toEqual([13, 18]) // Counter increments from 10 -> 13 -> 18
      })

      it('executes multiple decr operations in a batch', async () => {
        await cache.persistor.set('counter', '10')

        const multi = cache.persistor.multi()
        multi.decr('counter')
        multi.decr('counter')
        const results = await multi.exec()

        expect(results).toEqual([9, 8]) // Counter decrements from 10 -> 9 -> 8
      })

      it('executes multiple decrBy operations in a batch', async () => {
        await cache.persistor.set('counter', '20')

        const multi = cache.persistor.multi()
        multi.decrBy('counter', 4)
        multi.decrBy('counter', 6)
        const results = await multi.exec()

        expect(results).toEqual([16, 10]) // Counter decrements from 20 -> 16 -> 10
      })

      it('executes multiple hSet and hGet operations in a batch', async () => {
        const multi = cache.persistor.multi()
        multi.hSet('hash-key', 'field1', 'value1')
        multi.hSet('hash-key', 'field2', 'value2')
        multi.hGet('hash-key', 'field1')
        multi.hGet('hash-key', 'field2')

        const results = await multi.exec()

        expect(results).toEqual([1, 1, 'value1', 'value2'])
      })

      it('executes multiple list operations in a batch', async () => {
        const multi = cache.persistor.multi()
        multi.lPush('list-key', ['left1', 'left2'])
        multi.rPush('list-key', ['right1', 'right2'])
        multi.lRange('list-key', 0, -1)

        const results = await multi.exec()

        expect(results).toEqual([2, 4, ['left2', 'left1', 'right1', 'right2']])
      })

      it('executes multiple lPop and rPop operations in a batch', async () => {
        await persistor.rPush('list-key', ['a', 'b', 'c']) // Add elements to list

        const multi = persistor.multi()
        multi.lPop('list-key') // Should remove 'a'
        multi.rPop('list-key') // Should remove 'c'
        multi.lRange('list-key', 0, -1) // Remaining list should be ['b']

        const results = await multi.exec()

        expect(results).toEqual(['a', 'c', ['b']]) // Assert return values
      })

      it('executes multiple set operations in a batch', async () => {
        const multi = cache.persistor.multi()
        multi.sAdd('set-key', ['one', 'two', 'three'])
        multi.sRem('set-key', 'two')
        multi.sMembers('set-key')

        const results = await multi.exec()

        expect(results).toEqual([
          3,
          1,
          expect.arrayContaining(['one', 'three']),
        ])
      })

      it('executes multiple sorted set operations in a batch', async () => {
        const multi = cache.persistor.multi()
        multi.zAdd('sorted-key', [
          { score: 1, value: 'one' },
          { score: 2, value: 'two' },
          { score: 3, value: 'three' },
        ])
        multi.zRange('sorted-key', 0, -1)
        multi.zRem('sorted-key', 'two')

        const results = await multi.exec()

        expect(results).toEqual([3, ['one', 'two', 'three'], 1])
      })

      it('executes multiple expire operations in a batch', async () => {
        await cache.persistor.set('expiring-key1', 'value')
        await cache.persistor.set('expiring-key2', 'value')

        const multi = cache.persistor.multi()
        multi.expire('expiring-key1', 1)
        multi.expire('nonexistent-key', 1) // Should fail

        const results = await multi.exec()

        expect(results).toEqual([1, 0]) // true (set), false (key does not exist)

        await wait(1100)
        expect(await cache.persistor.get('expiring-key1')).toBeNull()
        expect(await cache.persistor.get('expiring-key2')).toBe('value') // Should not expire
      })

      it('executes multiple ttl operations in a batch', async () => {
        await cache.persistor.setEx('ttl-key1', 2, 'value')
        await cache.persistor.set('ttl-key2', 'value')

        const multi = cache.persistor.multi()
        multi.ttl('ttl-key1') // Should have TTL
        multi.ttl('ttl-key2') // No expiration
        multi.ttl('nonexistent-key') // Does not exist

        await wait(1000)
        const results = (await multi.exec()) as number[]

        expect(results[0]).toBeGreaterThan(0) // TTL should be > 0
        expect(results[1]).toBe(-1) // No expiration
        expect(results[2]).toBe(-2) // Key does not exist
      })

      it('executes multiple exists operations in a batch', async () => {
        await persistor.set('key1', 'value1')
        await persistor.set('key2', 'value2')

        const multi = cache.persistor.multi()
        multi.exists('key1')
        multi.exists('key3')
        const results = await multi.exec()

        expect(results).toEqual([1, 0])
      })

      it('executes multiple increment and decrement operations in a batch', async () => {
        await persistor.set('count', '10')

        const multi = cache.persistor.multi()
        multi.incr('count')
        multi.incrBy('count', 5)
        multi.decr('count')
        multi.decrBy('count', 2)

        const results = await multi.exec()

        expect(results).toEqual([11, 16, 15, 13])
      })

      it('executes multiple flushAll operations in a batch', async () => {
        await cache.persistor.set('key1', 'value1')
        await cache.persistor.set('key2', 'value2')

        const multi = cache.persistor.multi()
        multi.flushAll()

        const results = await multi.exec()
        expect(results).toEqual(['OK'])

        expect(await cache.persistor.get('key1')).toBeNull()
        expect(await cache.persistor.get('key2')).toBeNull()
      })

      it('executes multiple mixed operations in a batch', async () => {
        const multi = persistor.multi()

        // String operations
        multi.set('key1', 'value1')
        multi.setEx('key-ex', 2, 'expiring-value')
        multi.pSetEx('key-px', 500, 'millisecond-expiring-value')
        multi.setNX('unique-key', 'nx-value')
        multi.get('key1')
        multi.del('key1')
        multi.expire('key-ex', 3)
        multi.ttl('key-ex')
        multi.exists(['key-ex', 'non-existent-key'])

        // Numeric operations
        multi.incr('counter')
        multi.incrBy('counter', 3)
        multi.decr('counter')
        multi.decrBy('counter', 2)

        // Hash operations
        multi.hSet('hash-key', 'field1', 'hash-value1')
        multi.hSet('hash-key', 'field2', 'hash-value2')
        multi.hGet('hash-key', 'field1')

        // List operations (Push before Pop)
        multi.lPush('list-key', ['left1', 'left2'])
        multi.rPush('list-key', ['right1', 'right2'])
        multi.lPop('list-key')
        multi.rPop('list-key')
        multi.lRange('list-key', 0, -1)

        // Set operations
        multi.sAdd('set-key', ['one', 'two', 'three'])
        multi.sRem('set-key', 'two')
        multi.sMembers('set-key')

        // Sorted set operations
        multi.zAdd('sorted-key', [
          { score: 1, value: 'one' },
          { score: 2, value: 'two' },
          { score: 3, value: 'three' },
        ])
        multi.zRange('sorted-key', 0, -1)
        multi.zRem('sorted-key', 'two')

        // Flush all operation
        multi.flushAll()

        const results = await multi.exec()

        expect(results).toEqual([
          'OK', // set
          'OK', // setEx
          'OK', // pSetEx
          1, // setNX (new key added)
          'value1', // get
          1, // del (1 key deleted)
          1, // expire
          expect.any(Number), // ttl (remaining time for expiration)
          1, // exists (only 'key-ex' exists, not 'non-existent-key')

          1, // incr (counter 0 → 1)
          4, // incrBy (counter 1 → 4)
          3, // decr (counter 4 → 3)
          1, // decrBy (counter 3 → 1)

          1, // hSet (new field added)
          1, // hSet (new field added)
          'hash-value1', // hGet

          2, // lPush (new list length)
          4, // rPush (new list length after push)
          'left2', // lPop (first element removed)
          'right2', // rPop (last element removed)
          ['left1', 'right1'], // lRange (remaining list content)

          3, // sAdd (three new values added)
          1, // sRem (one value removed)
          expect.arrayContaining(['one', 'three']), // sMembers (remaining set members)

          3, // zAdd (three new values added)
          ['one', 'two', 'three'], // zRange (entire sorted set)
          1, // zRem (one value removed)

          'OK', // flushAll (everything cleared)
        ])
      })
    })
  })
})
