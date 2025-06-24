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

    it('returns null when set is used with NX and the key already exists', async () => {
      await persistor.set('existing-key', 'initial')
      const result = await persistor.set('existing-key', 'new-value', {
        NX: true,
      })
      expect(result).toBeNull()
      expect(await persistor.get('existing-key')).toBe('initial') // Should not be overwritten
    })

    it('overwrites a key when set is used with XX', async () => {
      await persistor.set('existing-key', 'initial')
      const result = await persistor.set('existing-key', 'updated', {
        XX: true,
      })
      expect(result).toBe('OK')
      expect(await persistor.get('existing-key')).toBe('updated')
    })

    it('returns null when set is used with XX and the key does not exist', async () => {
      const result = await persistor.set('non-existent-key', 'value', {
        XX: true,
      })
      expect(result).toBeNull()
      expect(await persistor.get('non-existent-key')).toBeNull()
    })

    it('sets expiration using EXAT', async () => {
      const futureTimestamp = Math.floor((Date.now() + 2000) / 1000) // 2 sec ahead
      await persistor.set('key-exat', 'value', { EXAT: futureTimestamp })

      expect(await persistor.get('key-exat')).toBe('value')

      vi.advanceTimersByTime(2000)
      expect(await persistor.get('key-exat')).toBeNull()
    })

    it('sets expiration using PXAT', async () => {
      const futureTimestamp = Date.now() + 1500 // 1.5 sec ahead
      await persistor.set('key-pxat', 'value', { PXAT: futureTimestamp })

      expect(await persistor.get('key-pxat')).toBe('value')

      vi.advanceTimersByTime(1500)
      expect(await persistor.get('key-pxat')).toBeNull()
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

    it('removes expiration when deleting a key', async () => {
      await persistor.set('expiring-key', 'value', { EX: 5 }) // Set with expiration
      expect(await persistor.ttl('expiring-key')).toBeGreaterThan(0) // Ensure TTL exists

      await persistor.del('expiring-key')
      expect(await persistor.ttl('expiring-key')).toBe(-2) // Key should be gone
    })
  })

  describe('.expire', () => {
    it('sets expiration on an existing key', async () => {
      await persistor.set('expiring-key', 'value')
      const result = await persistor.expire('expiring-key', 1)
      expect(result).toBe(1)

      expect(await persistor.get('expiring-key')).toBe('value')

      vi.advanceTimersByTime(1100)
      expect(await persistor.get('expiring-key')).toBeNull()
    })

    it('returns false when trying to expire a non-existent key', async () => {
      const result = await persistor.expire('non-existent-key', 1)
      expect(result).toBe(0)
    })

    it('returns false when trying to expire an already expired key', async () => {
      await persistor.setEx('temp-key', 1, 'value')

      vi.advanceTimersByTime(1100)
      expect(await persistor.expire('temp-key', 2)).toBe(0)
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

    it('clears active expirations when flushAll is called', async () => {
      await persistor.set('expiring-key', 'value', { EX: 10 }) // Set a key with expiration

      expect(await persistor.get('expiring-key')).toBe('value') // Ensure it's there

      await persistor.flushAll() // Should trigger the loop

      expect(await persistor.get('expiring-key')).toBeNull() // Store is cleared
    })

    it('removes all expirations when calling flushAll()', async () => {
      await persistor.set('key1', 'value1', { EX: 5 }) // Expiring key
      await persistor.set('key2', 'value2', { EX: 10 }) // Another expiring key
      expect(await persistor.ttl('key1')).toBeGreaterThan(0)
      expect(await persistor.ttl('key2')).toBeGreaterThan(0)

      await persistor.flushAll()
      expect(await persistor.ttl('key1')).toBe(-2)
      expect(await persistor.ttl('key2')).toBe(-2)
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
      expect(firstSet).toBe(1)
      expect(await persistor.get('nx-key')).toBe('first-value')

      const secondSet = await persistor.setNX('nx-key', 'second-value')
      expect(secondSet).toBe(0)
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

    it('updates an existing hash field', async () => {
      await persistor.hSet('hash-key', 'field', 'value1')
      const result = await persistor.hSet('hash-key', 'field', 'value2')

      expect(result).toBe(0) // 0 means field was updated, not newly added
      expect(await persistor.hGet('hash-key', 'field')).toBe('value2')
    })

    it('returns undefined when getting a non-existent hash field', async () => {
      await persistor.hSet('hash-key', 'field1', 'value1')
      expect(await persistor.hGet('hash-key', 'non-existent-field')).toBe(null)
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

    it('pushes elements into an empty list', async () => {
      expect(await persistor.lPush('empty-list', ['item1'])).toBe(1)
      expect(await persistor.rPush('empty-list', ['item2'])).toBe(2)
      expect(await persistor.lRange('empty-list', 0, -1)).toEqual([
        'item1',
        'item2',
      ])
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

    it('returns null when popping from an empty list', async () => {
      expect(await persistor.lPop('empty-list')).toBeNull()
      expect(await persistor.rPop('empty-list')).toBeNull()
    })

    it('removes the key when the last element is popped from a the left', async () => {
      await persistor.rPush('pop-key', ['only-element']) // 1 element list

      expect(await persistor.lPop('pop-key')).toBe('only-element') // Pop last item
      expect(await persistor.get('pop-key')).toBeNull() // Key should be deleted
    })

    it('removes the key when the last element is popped from the right', async () => {
      await persistor.rPush('pop-key', ['only-element']) // 1 element list

      expect(await persistor.rPop('pop-key')).toBe('only-element') // Pop last item
      expect(await persistor.get('pop-key')).toBeNull() // Key should be deleted
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

    it('does not add duplicate elements to a set', async () => {
      expect(await persistor.sAdd('set-key', ['one', 'two'])).toBe(2)
      expect(await persistor.sAdd('set-key', ['two', 'three'])).toBe(1) // Only 'three' is new
      expect(await persistor.sMembers('set-key')).toEqual(
        expect.arrayContaining(['one', 'two', 'three'])
      )
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

    it('updates the score of an existing sorted set member', async () => {
      await persistor.zAdd('sorted-key', [{ score: 1, value: 'one' }])
      const result = await persistor.zAdd('sorted-key', [
        { score: 3, value: 'one' },
      ])

      expect(result).toBe(0) // No new elements, just an update
      expect(await persistor.zRange('sorted-key', 0, -1)).toEqual(['one']) // Still same member
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

      expect(results).toEqual([1, 0])
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

      expect(results).toEqual([1])
      expect(await persistor.get('expiring-key')).toBe('value')

      vi.advanceTimersByTime(1100)
      expect(await persistor.get('expiring-key')).toBeNull()
    })

    it('executes multiple ttl operations in a batch', async () => {
      await persistor.setEx('expiring-key', 2, 'value')

      const multi = persistor.multi()
      multi.ttl('expiring-key')
      const results = (await multi.exec()) as number[]

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

    it('executes multiple lPop and rPop operations in a batch', async () => {
      await persistor.rPush('list-key', ['a', 'b', 'c']) // Add elements to list

      const multi = persistor.multi()
      multi.lPop('list-key') // Should remove 'a'
      multi.rPop('list-key') // Should remove 'c'
      multi.lRange('list-key', 0, -1) // Remaining list should be ['b']

      const results = await multi.exec()

      expect(results).toEqual(['a', 'c', ['b']]) // Assert return values
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
