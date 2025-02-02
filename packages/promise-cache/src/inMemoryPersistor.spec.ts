import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryPersistor } from './inMemoryPersistor'
import type { IPersistor } from './types'

describe('InMemoryPersistor', () => {
  let persistor: IPersistor
  beforeEach(() => {
    vi.useFakeTimers()
    persistor = new InMemoryPersistor()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('.set', () => {
    it('stores a value and retrieves it', async () => {
      const result = await persistor.set('key', 'value')
      expect(result).toBe('OK')
      expect(await persistor.get('key')).toBe('value')
    })

    it('overwrites an existing key', async () => {
      expect(await persistor.set('key', 'value1')).toBe('OK')
      const result = await persistor.set('key', 'value2')
      expect(result).toBe('OK')
      expect(await persistor.get('key')).toBe('value2')
    })
  })

  describe('.get', () => {
    it('retrieves a stored value', async () => {
      await persistor.set('key', 'value')
      expect(await persistor.get('key')).toBe('value')
    })

    it('returns null for a non-existent key', async () => {
      expect(await persistor.get('non-existent-key')).toBeNull()
    })
  })

  describe('.del', () => {
    it('deletes an existing key', async () => {
      await persistor.set('key', 'value')
      const result = await persistor.del('key')
      expect(result).toBe(1)
      expect(await persistor.get('key')).toBeNull()
    })

    it('returns 0 when deleting a non-existent key', async () => {
      const result = await persistor.del('non-existent-key')
      expect(result).toBe(0)
    })
  })

  describe('.expire', () => {
    it('sets expiration on an existing key', async () => {
      await persistor.set('expiring-key', 'value')
      const result = await persistor.expire('expiring-key', 1)
      expect(result).toBe(true)

      expect(await persistor.get('expiring-key')).toBe('value')

      vi.advanceTimersByTime(1100)
      expect(await persistor.get('expiring-key')).toBeNull()
    })

    it('returns false when trying to expire a non-existent key', async () => {
      const result = await persistor.expire('non-existent-key', 1)
      expect(result).toBe(false)
    })
  })

  describe('.ttl', () => {
    it('returns correct TTL for an expiring key', async () => {
      await persistor.setEx('ttl-key', 2, 'value')

      vi.advanceTimersByTime(1000)
      const ttl = await persistor.ttl('ttl-key')
      expect(ttl).toBeGreaterThan(0)
      expect(ttl).toBeLessThanOrEqual(1)
    })

    it('returns -1 for a key without expiration', async () => {
      await persistor.set('persistent-key', 'value')
      expect(await persistor.ttl('persistent-key')).toBe(-1)
    })

    it('returns -2 for a non-existent key', async () => {
      expect(await persistor.ttl('non-existent-key')).toBe(-2)
    })
  })

  describe('.flushAll', () => {
    it('removes all keys from storage', async () => {
      await persistor.set('key1', 'value1')
      await persistor.set('key2', 'value2')

      const result = await persistor.flushAll()
      expect(result).toBe('OK')

      expect(await persistor.get('key1')).toBeNull()
      expect(await persistor.get('key2')).toBeNull()
    })
  })

  describe('.setEx', () => {
    it('sets a key with expiration in seconds', async () => {
      const result = await persistor.setEx('key-ex', 2, 'value')
      expect(result).toBe('OK')

      expect(await persistor.get('key-ex')).toBe('value')

      vi.advanceTimersByTime(2000)
      expect(await persistor.get('key-ex')).toBeNull()
    })
  })

  describe('.pSetEx', () => {
    it('sets a key with expiration in milliseconds', async () => {
      const result = await persistor.pSetEx('key-px', 500, 'value')
      expect(result).toBe('OK')

      expect(await persistor.get('key-px')).toBe('value')

      vi.advanceTimersByTime(500)
      expect(await persistor.get('key-px')).toBeNull()
    })
  })

  describe('.setNX', () => {
    it('only sets a key if it does not exist', async () => {
      const firstSet = await persistor.setNX('nx-key', 'first-value')
      expect(firstSet).toBe(true)
      expect(await persistor.get('nx-key')).toBe('first-value')

      const secondSet = await persistor.setNX('nx-key', 'second-value')
      expect(secondSet).toBe(false)
      expect(await persistor.get('nx-key')).toBe('first-value')
    })
  })

  describe('.exists', () => {
    it('returns 1 if a key exists', async () => {
      await persistor.set('existing-key', 'value')
      expect(await persistor.exists('existing-key')).toBe(1)
    })

    it('returns 0 if a key does not exist', async () => {
      expect(await persistor.exists('non-existent-key')).toBe(0)
    })

    it('returns the count of existing keys when multiple keys are checked', async () => {
      await persistor.set('key1', 'value1')
      await persistor.set('key2', 'value2')
      expect(await persistor.exists(['key1', 'key2', 'key3'])).toBe(2) // Only key1 and key2 exist
    })
  })

  describe('.incr', () => {
    it('increments a key by 1', async () => {
      await persistor.set('counter', '5')
      expect(await persistor.incr('counter')).toBe(6)
    })

    it('initializes a key to 1 if it does not exist', async () => {
      expect(await persistor.incr('new-counter')).toBe(1)
    })
  })

  describe('.incrBy', () => {
    it('increments a key by a specified value', async () => {
      await persistor.set('counter', '10')
      expect(await persistor.incrBy('counter', 3)).toBe(13)
    })

    it('initializes a key to the increment value if it does not exist', async () => {
      expect(await persistor.incrBy('new-counter', 5)).toBe(5)
    })
  })

  describe('.decr', () => {
    it('decrements a key by 1', async () => {
      await persistor.set('counter', '10')
      expect(await persistor.decr('counter')).toBe(9)
    })

    it('initializes a key to -1 if it does not exist', async () => {
      expect(await persistor.decr('new-counter')).toBe(-1)
    })
  })

  describe('.decrBy', () => {
    it('decrements a key by a specified value', async () => {
      await persistor.set('counter', '20')
      expect(await persistor.decrBy('counter', 4)).toBe(16)
    })

    it('initializes a key to the negative decrement value if it does not exist', async () => {
      expect(await persistor.decrBy('new-counter', 5)).toBe(-5)
    })
  })

  describe('.hSet and .hGet', () => {
    it('stores and retrieves a field in a hash', async () => {
      const result = await persistor.hSet('hash-key', 'field1', 'value1')
      expect(result).toBe(1) // 1 means a new field was added
      const value = await persistor.hGet('hash-key', 'field1')
      expect(value).toBe('value1')
    })
  })

  describe('.lPush and .rPush', () => {
    it('adds elements to the left and right of a list', async () => {
      const lPushResult = await persistor.lPush('list-key', ['left1', 'left2'])
      expect(lPushResult).toBe(2)

      const rPushResult = await persistor.rPush('list-key', [
        'right1',
        'right2',
      ])
      expect(rPushResult).toBe(4)

      const range = await persistor.lRange('list-key', 0, -1)
      expect(range).toEqual(['left2', 'left1', 'right1', 'right2'])
    })
  })

  describe('.lPop and .rPop', () => {
    it('removes and returns elements from a list', async () => {
      await persistor.rPush('pop-key', ['a', 'b', 'c'])

      const left = await persistor.lPop('pop-key')
      expect(left).toBe('a')

      const right = await persistor.rPop('pop-key')
      expect(right).toBe('c')

      const remaining = await persistor.lRange('pop-key', 0, -1)
      expect(remaining).toEqual(['b'])
    })
  })

  describe('.sAdd, .sRem, and .sMembers', () => {
    it('adds, removes, and retrieves set members', async () => {
      const sAddResult = await persistor.sAdd('set-key', [
        'one',
        'two',
        'three',
      ])
      expect(sAddResult).toBe(3) // Number of elements added

      let members = await persistor.sMembers('set-key')
      expect(members.sort()).toEqual(['one', 'three', 'two'])

      const sRemResult = await persistor.sRem('set-key', 'two')
      expect(sRemResult).toBe(1) // 1 means an element was removed

      members = await persistor.sMembers('set-key')
      expect(members.sort()).toEqual(['one', 'three'])
    })
  })

  describe('.zAdd, .zRange, and .zRem', () => {
    it('adds, retrieves, and removes sorted set members', async () => {
      const zAddResult = await persistor.zAdd('sorted-key', [
        { score: 1, value: 'one' },
        { score: 2, value: 'two' },
        { score: 3, value: 'three' },
      ])
      expect(zAddResult).toBe(3) // 3 items added

      const range = await persistor.zRange('sorted-key', 0, -1)
      expect(range).toEqual(['one', 'two', 'three'])

      const zRemResult = await persistor.zRem('sorted-key', 'two')
      expect(zRemResult).toBe(1) // 1 means one item was removed

      const updatedRange = await persistor.zRange('sorted-key', 0, -1)
      expect(updatedRange).toEqual(['one', 'three'])
    })
  })

  describe('.multi', () => {
    it('executes multiple set operations in a batch', async () => {
      const multi = persistor.multi()
      multi.set('key1', 'value1')
      multi.set('key2', 'value2')
      await multi.exec()

      expect(await persistor.get('key1')).toBe('value1')
      expect(await persistor.get('key2')).toBe('value2')
    })

    it('executes multiple setEx operations in a batch', async () => {
      const multi = persistor.multi()
      multi.setEx('expiring-key', 1, 'value')
      const results = await multi.exec()

      expect(results).toEqual(['OK'])
      expect(await persistor.get('expiring-key')).toBe('value')

      vi.advanceTimersByTime(1100)
      expect(await persistor.get('expiring-key')).toBeNull()
    })

    it('executes multiple pSetEx operations in a batch', async () => {
      const multi = persistor.multi()
      multi.pSetEx('expiring-ms-key', 500, 'value')
      const results = await multi.exec()

      expect(results).toEqual(['OK'])
      expect(await persistor.get('expiring-ms-key')).toBe('value')

      vi.advanceTimersByTime(600)
      expect(await persistor.get('expiring-ms-key')).toBeNull()
    })

    it('executes multiple setNX operations in a batch', async () => {
      const multi = persistor.multi()
      multi.setNX('unique-key', 'first')
      multi.setNX('unique-key', 'second') // Should fail
      const results = await multi.exec()

      expect(results).toEqual([true, false])
      expect(await persistor.get('unique-key')).toBe('first') // Should not be overridden
    })

    it('executes multiple get operations in a batch', async () => {
      await persistor.set('key1', 'value1')
      await persistor.set('key2', 'value2')

      const multi = persistor.multi()
      multi.get('key1')
      multi.get('key2')
      const results = await multi.exec()

      expect(results).toEqual(['value1', 'value2'])
    })

    it('executes multiple del operations in a batch', async () => {
      await persistor.set('key1', 'value1')
      await persistor.set('key2', 'value2')

      const multi = persistor.multi()
      multi.del('key1')
      multi.del('key2')
      const results = await multi.exec()

      expect(results).toEqual([1, 1]) // 1 means each key was deleted
      expect(await persistor.get('key1')).toBeNull()
      expect(await persistor.get('key2')).toBeNull()
    })

    it('executes multiple expire operations in a batch', async () => {
      await persistor.set('expiring-key', 'value')

      const multi = persistor.multi()
      multi.expire('expiring-key', 1)
      const results = await multi.exec()

      expect(results).toEqual([true])
      expect(await persistor.get('expiring-key')).toBe('value')

      vi.advanceTimersByTime(1100)
      expect(await persistor.get('expiring-key')).toBeNull()
    })

    it('executes multiple ttl operations in a batch', async () => {
      await persistor.setEx('expiring-key', 2, 'value')

      const multi = persistor.multi()
      multi.ttl('expiring-key')
      const results = await multi.exec()

      expect(results[0]).toBeGreaterThan(0) // Should be at most 2 seconds
    })

    it('executes multiple flushAll operations in a batch', async () => {
      await persistor.set('key1', 'value1')
      await persistor.set('key2', 'value2')

      const multi = persistor.multi()
      multi.flushAll()
      const results = await multi.exec()

      expect(results).toEqual(['OK'])
      expect(await persistor.get('key1')).toBeNull()
      expect(await persistor.get('key2')).toBeNull()
    })

    it('executes multiple exists operations in a batch', async () => {
      await persistor.set('existing-key', 'value')

      const multi = persistor.multi()
      multi.exists('existing-key')
      multi.exists('non-existent-key')
      const results = await multi.exec()

      expect(results).toEqual([1, 0]) // 1 for existing key, 0 for non-existent key
    })

    it('executes multiple incr operations in a batch', async () => {
      await persistor.set('counter', '5')

      const multi = persistor.multi()
      multi.incr('counter')
      multi.incr('counter')
      const results = await multi.exec()

      expect(results).toEqual([6, 7]) // Counter increments from 5 -> 6 -> 7
    })

    it('executes multiple incrBy operations in a batch', async () => {
      await persistor.set('counter', '10')

      const multi = persistor.multi()
      multi.incrBy('counter', 3)
      multi.incrBy('counter', 5)
      const results = await multi.exec()

      expect(results).toEqual([13, 18]) // Counter increments from 10 -> 13 -> 18
    })

    it('executes multiple decr operations in a batch', async () => {
      await persistor.set('counter', '10')

      const multi = persistor.multi()
      multi.decr('counter')
      multi.decr('counter')
      const results = await multi.exec()

      expect(results).toEqual([9, 8]) // Counter decrements from 10 -> 9 -> 8
    })

    it('executes multiple decrBy operations in a batch', async () => {
      await persistor.set('counter', '20')

      const multi = persistor.multi()
      multi.decrBy('counter', 4)
      multi.decrBy('counter', 6)
      const results = await multi.exec()

      expect(results).toEqual([16, 10]) // Counter decrements from 20 -> 16 -> 10
    })

    it('executes multiple hSet and hGet operations in a batch', async () => {
      const multi = persistor.multi()
      multi.hSet('hash-key', 'field1', 'value1')
      multi.hSet('hash-key', 'field2', 'value2')
      multi.hGet('hash-key', 'field1')
      multi.hGet('hash-key', 'field2')

      const results = await multi.exec()

      expect(results).toEqual([1, 1, 'value1', 'value2'])
    })

    it('executes multiple list operations in a batch', async () => {
      const multi = persistor.multi()
      multi.lPush('list-key', ['left1', 'left2'])
      multi.rPush('list-key', ['right1', 'right2'])
      multi.lRange('list-key', 0, -1)

      const results = await multi.exec()

      expect(results).toEqual([2, 4, ['left2', 'left1', 'right1', 'right2']])
    })

    it('executes multiple sAdd operations in a batch', async () => {
      const multi = persistor.multi()
      multi.sAdd('set-key', ['one', 'two', 'three'])
      multi.sRem('set-key', 'two')
      multi.sMembers('set-key')

      const results = await multi.exec()

      expect(results).toEqual([3, 1, expect.arrayContaining(['one', 'three'])])
    })

    it('executes multiple sRem operations in a batch', async () => {
      await persistor.sAdd('set-key', ['one', 'two', 'three'])

      const multi = persistor.multi()
      multi.sRem('set-key', 'two')
      const results = await multi.exec()

      expect(results).toEqual([1]) // 1 means one item was removed
      expect(await persistor.sMembers('set-key')).toEqual(
        expect.arrayContaining(['one', 'three'])
      )
    })

    it('executes multiple sorted set operations in a batch', async () => {
      const multi = persistor.multi()
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

    it('executes multiple zRem operations in a batch', async () => {
      await persistor.zAdd('sorted-key', [
        { score: 1, value: 'one' },
        { score: 2, value: 'two' },
        { score: 3, value: 'three' },
      ])

      const multi = persistor.multi()
      multi.zRem('sorted-key', 'two')
      const results = await multi.exec()

      expect(results).toEqual([1]) // 1 means one item was removed
      expect(await persistor.zRange('sorted-key', 0, -1)).toEqual([
        'one',
        'three',
      ])
    })

    it('executes multiple mixed operations in a batch', async () => {
      const multi = persistor.multi()
      multi.set('key1', 'value1')
      multi.hSet('hash-key', 'field', 'hash-value')
      multi.lPush('list-key', ['list-item1', 'list-item2'])
      multi.rPush('list-key', ['list-item3', 'list-item4'])
      multi.sAdd('set-key', ['set-value1', 'set-value2'])
      multi.zAdd('sorted-key', [{ score: 1, value: 'sorted-item' }])
      multi.incr('counter')
      multi.get('key1')
      multi.hGet('hash-key', 'field')
      multi.lRange('list-key', 0, -1)
      multi.sMembers('set-key')
      multi.zRange('sorted-key', 0, -1)
      multi.exists('key1')

      const results = await multi.exec()

      expect(results).toEqual([
        'OK', // set
        1, // hSet
        2, // lPush
        4, // rPush
        2, // sAdd
        1, // zAdd
        1, // incr
        'value1', // get
        'hash-value', // hGet
        ['list-item2', 'list-item1', 'list-item3', 'list-item4'], // lRange
        expect.arrayContaining(['set-value1', 'set-value2']), // sMembers
        ['sorted-item'], // zRange
        1, // exists
      ])
    })
  })
})
