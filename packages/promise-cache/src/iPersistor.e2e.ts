import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'
import { createClient } from 'redis'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest'
import { InMemoryPersistor } from './inMemoryPersistor'

let redis: StartedRedisContainer
let redisClient: ReturnType<typeof createClient>
let memoryClient: InMemoryPersistor

beforeAll(async () => {
  redis = await new RedisContainer('redis:8-alpine').start()
  redisClient = createClient({ url: redis.getConnectionUrl() })
  await redisClient.connect()
}, 60_000)

afterAll(async () => {
  await redisClient.disconnect()
  await redis.stop()
})

beforeEach(() => {
  memoryClient = new InMemoryPersistor()
})

afterEach(async () => {
  await redis.executeCliCmd('FLUSHALL')
})

describe('set, get', () => {
  test('string value', async () => {
    const key = 'key'
    const value = 'value'
    expect(await redisClient.set(key, value)).toEqual(
      await memoryClient.set(key, value)
    )
    expect(await redisClient.get(key)).toEqual(await memoryClient.get(key))
  })
  test('number value', async () => {
    const key = 'key'
    const value = 16
    expect(await redisClient.set(key, value)).toEqual(
      await memoryClient.set(key, value)
    )
    expect(await redisClient.get(key)).toEqual(await memoryClient.get(key))
  })
  test('missing value', async () => {
    const key = 'missing'
    expect(await redisClient.get(key)).toEqual(await memoryClient.get(key))
  })
})

describe('hSet, hGet, hGetAll', () => {
  test('set / get all', async () => {
    const key = 'key'
    const value = { foo: 'bar' }
    expect(await redisClient.hSet(key, value)).toEqual(
      await memoryClient.hSet(key, value)
    )
    expect(await redisClient.hGetAll(key)).toEqual(
      await memoryClient.hGetAll(key)
    )
  })
  test('set / get field', async () => {
    const key = 'key'
    const field = 'foo'
    const value = 'bar'
    expect(await redisClient.hSet(key, field, value)).toEqual(
      await memoryClient.hSet(key, field, value)
    )
    expect(await redisClient.hGet(key, field)).toEqual(
      await memoryClient.hGet(key, field)
    )
  })
  test('set all / get field', async () => {
    const key = 'key'
    const field = 'foo'
    const value = 'bar'
    expect(await redisClient.hSet(key, { [field]: value })).toEqual(
      await memoryClient.hSet(key, { [field]: value })
    )
    expect(await redisClient.hGet(key, field)).toEqual(
      await memoryClient.hGet(key, field)
    )
  })
  test('set field / get all', async () => {
    const key = 'key'
    const field = 'foo'
    const value = 'bar'
    expect(await redisClient.hSet(key, field, value)).toEqual(
      await memoryClient.hSet(key, field, value)
    )
    expect(await redisClient.hGetAll(key)).toEqual(
      await memoryClient.hGetAll(key)
    )
  })
  test('set, set partial / get all', async () => {
    const key = 'key'
    expect(await redisClient.hSet(key, { foo: 'bar' })).toEqual(
      await memoryClient.hSet(key, { foo: 'bar' })
    )
    expect(await redisClient.hSet(key, { herp: 'derp' })).toEqual(
      await memoryClient.hSet(key, { herp: 'derp' })
    )
    expect(await redisClient.hGetAll(key)).toEqual(
      await memoryClient.hGetAll(key)
    )
    expect(await redisClient.hGetAll(key)).toEqual({
      foo: 'bar',
      herp: 'derp',
    })
  })
  test('missing value', async () => {
    const key = 'missing'
    expect(await redisClient.hGetAll(key)).toEqual(
      await memoryClient.hGetAll(key)
    )
  })
})

describe('hDel', () => {
  test('deletes a single field', async () => {
    const key = 'key'
    await redisClient.hSet(key, { foo: 'bar', baz: 'qux' })
    await memoryClient.hSet(key, { foo: 'bar', baz: 'qux' })
    expect(await redisClient.hDel(key, 'foo')).toEqual(
      await memoryClient.hDel(key, 'foo')
    )
    expect(await redisClient.hGetAll(key)).toEqual(
      await memoryClient.hGetAll(key)
    )
  })
  test('deletes multiple fields', async () => {
    const key = 'key'
    await redisClient.hSet(key, { foo: 'bar', baz: 'qux', herp: 'derp' })
    await memoryClient.hSet(key, { foo: 'bar', baz: 'qux', herp: 'derp' })
    expect(await redisClient.hDel(key, ['foo', 'baz'])).toEqual(
      await memoryClient.hDel(key, ['foo', 'baz'])
    )
    expect(await redisClient.hGetAll(key)).toEqual(
      await memoryClient.hGetAll(key)
    )
  })
  test('returns 0 for non-existing field', async () => {
    const key = 'key'
    await redisClient.hSet(key, { foo: 'bar' })
    await memoryClient.hSet(key, { foo: 'bar' })
    expect(await redisClient.hDel(key, 'missing')).toEqual(
      await memoryClient.hDel(key, 'missing')
    )
  })
  test('returns 0 for non-existing key', async () => {
    const key = 'missing'
    expect(await redisClient.hDel(key, 'foo')).toEqual(
      await memoryClient.hDel(key, 'foo')
    )
  })
})

describe('zAdd, zIncrBy, zRangeWithScores', () => {
  test('adds a member with a score', async () => {
    const key = 'instruments:by_volume'
    expect(await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })).toEqual(
      await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    )
    expect(await redisClient.zRangeWithScores(key, 0, -1)).toEqual(
      await memoryClient.zRangeWithScores(key, 0, -1)
    )
  })
  test('updates score when adding existing member', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await redisClient.zAdd(key, { score: 2000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 2000, value: 'AAPL' })
    expect(await redisClient.zRangeWithScores(key, 0, -1)).toEqual(
      await memoryClient.zRangeWithScores(key, 0, -1)
    )
  })
  test('increments score of existing member', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    expect(await redisClient.zIncrBy(key, 500, 'AAPL')).toEqual(
      await memoryClient.zIncrBy(key, 500, 'AAPL')
    )
    expect(await redisClient.zRangeWithScores(key, 0, -1)).toEqual(
      await memoryClient.zRangeWithScores(key, 0, -1)
    )
  })
  test('increments score of non-existing member', async () => {
    const key = 'instruments:by_volume'
    expect(await redisClient.zIncrBy(key, 500, 'AAPL')).toEqual(
      await memoryClient.zIncrBy(key, 500, 'AAPL')
    )
    expect(await redisClient.zRangeWithScores(key, 0, -1)).toEqual(
      await memoryClient.zRangeWithScores(key, 0, -1)
    )
  })
  test('returns members in ascending score order', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await redisClient.zAdd(key, { score: 2000, value: 'GOOG' })
    await memoryClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 2000, value: 'GOOG' })
    expect(await redisClient.zRangeWithScores(key, 0, -1)).toEqual(
      await memoryClient.zRangeWithScores(key, 0, -1)
    )
  })
  test('returns top N members in descending score order', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await redisClient.zAdd(key, { score: 2000, value: 'GOOG' })
    await memoryClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 2000, value: 'GOOG' })
    expect(
      await redisClient.zRangeWithScores(key, 0, 1, { REV: true })
    ).toEqual(await memoryClient.zRangeWithScores(key, 0, 1, { REV: true }))
  })
  test('returns top 1 member', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    expect(
      await redisClient.zRangeWithScores(key, 0, 0, { REV: true })
    ).toEqual(await memoryClient.zRangeWithScores(key, 0, 0, { REV: true }))
  })
  test('returns empty array for missing key', async () => {
    const key = 'missing'
    expect(await redisClient.zRangeWithScores(key, 0, -1)).toEqual(
      await memoryClient.zRangeWithScores(key, 0, -1)
    )
  })
})

describe('zScore', () => {
  test('returns score of existing member', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    expect(await redisClient.zScore(key, 'AAPL')).toEqual(
      await memoryClient.zScore(key, 'AAPL')
    )
  })
  test('returns null for missing member', async () => {
    const key = 'instruments:by_volume'
    expect(await redisClient.zScore(key, 'AAPL')).toEqual(
      await memoryClient.zScore(key, 'AAPL')
    )
  })
})

describe('zRank', () => {
  test('returns rank of existing member', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await redisClient.zAdd(key, { score: 2000, value: 'GOOG' })
    await memoryClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 2000, value: 'GOOG' })
    expect(await redisClient.zRank(key, 'AAPL')).toEqual(
      await memoryClient.zRank(key, 'AAPL')
    )
    expect(await redisClient.zRank(key, 'GOOG')).toEqual(
      await memoryClient.zRank(key, 'GOOG')
    )
    expect(await redisClient.zRank(key, 'MSFT')).toEqual(
      await memoryClient.zRank(key, 'MSFT')
    )
  })
  test('returns null for missing member', async () => {
    const key = 'instruments:by_volume'
    expect(await redisClient.zRank(key, 'AAPL')).toEqual(
      await memoryClient.zRank(key, 'AAPL')
    )
  })
})

describe('zCount', () => {
  test('counts members within score range', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await redisClient.zAdd(key, { score: 2000, value: 'GOOG' })
    await memoryClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 2000, value: 'GOOG' })
    expect(await redisClient.zCount(key, 1000, 2000)).toEqual(
      await memoryClient.zCount(key, 1000, 2000)
    )
  })
  test('counts all members', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    expect(await redisClient.zCount(key, 0, 9999)).toEqual(
      await memoryClient.zCount(key, 0, 9999)
    )
  })
  test('returns 0 for empty range', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    expect(await redisClient.zCount(key, 2000, 3000)).toEqual(
      await memoryClient.zCount(key, 2000, 3000)
    )
  })
  test('returns 0 for missing key', async () => {
    const key = 'missing'
    expect(await redisClient.zCount(key, 0, 9999)).toEqual(
      await memoryClient.zCount(key, 0, 9999)
    )
  })
})

describe('zRangeByScore', () => {
  test('returns members within score range', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await redisClient.zAdd(key, { score: 2000, value: 'GOOG' })
    await memoryClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 2000, value: 'GOOG' })
    expect(await redisClient.zRangeByScore(key, 1000, 2000)).toEqual(
      await memoryClient.zRangeByScore(key, 1000, 2000)
    )
  })
  test('returns empty array for empty range', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    expect(await redisClient.zRangeByScore(key, 2000, 3000)).toEqual(
      await memoryClient.zRangeByScore(key, 2000, 3000)
    )
  })
  test('returns empty array for missing key', async () => {
    const key = 'missing'
    expect(await redisClient.zRangeByScore(key, 0, 9999)).toEqual(
      await memoryClient.zRangeByScore(key, 0, 9999)
    )
  })
})

describe('zRangeByScoreWithScores', () => {
  test('returns members with scores within score range', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await redisClient.zAdd(key, { score: 2000, value: 'GOOG' })
    await memoryClient.zAdd(key, { score: 3000, value: 'MSFT' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 2000, value: 'GOOG' })
    expect(await redisClient.zRangeByScoreWithScores(key, 1000, 2000)).toEqual(
      await memoryClient.zRangeByScoreWithScores(key, 1000, 2000)
    )
  })
  test('returns empty array for empty range', async () => {
    const key = 'instruments:by_volume'
    await redisClient.zAdd(key, { score: 1000, value: 'AAPL' })
    await memoryClient.zAdd(key, { score: 1000, value: 'AAPL' })
    expect(await redisClient.zRangeByScoreWithScores(key, 2000, 3000)).toEqual(
      await memoryClient.zRangeByScoreWithScores(key, 2000, 3000)
    )
  })
  test('returns empty array for missing key', async () => {
    const key = 'missing'
    expect(await redisClient.zRangeByScoreWithScores(key, 0, 9999)).toEqual(
      await memoryClient.zRangeByScoreWithScores(key, 0, 9999)
    )
  })
})

describe('del', () => {
  test('deletes a single key', async () => {
    await redisClient.set('a', '1')
    await memoryClient.set('a', '1')
    expect(await redisClient.del('a')).toEqual(await memoryClient.del('a'))
    expect(await redisClient.get('a')).toEqual(await memoryClient.get('a'))
  })
  test('deletes multiple keys', async () => {
    await redisClient.set('a', '1')
    await redisClient.set('b', '2')
    await redisClient.set('c', '3')
    await memoryClient.set('a', '1')
    await memoryClient.set('b', '2')
    await memoryClient.set('c', '3')
    expect(await redisClient.del(['a', 'b'])).toEqual(
      await memoryClient.del(['a', 'b'])
    )
    expect(await redisClient.get('a')).toEqual(await memoryClient.get('a'))
    expect(await redisClient.get('b')).toEqual(await memoryClient.get('b'))
    expect(await redisClient.get('c')).toEqual(await memoryClient.get('c'))
  })
  test('returns 0 for missing key', async () => {
    expect(await redisClient.del('missing')).toEqual(
      await memoryClient.del('missing')
    )
  })
  test('returns count of deleted keys', async () => {
    await redisClient.set('a', '1')
    await redisClient.set('b', '2')
    await memoryClient.set('a', '1')
    await memoryClient.set('b', '2')
    expect(await redisClient.del(['a', 'b', 'missing'])).toEqual(
      await memoryClient.del(['a', 'b', 'missing'])
    )
  })
})

describe('del multi', () => {
  test('deletes multiple keys in a batch', async () => {
    await redisClient.set('a', '1')
    await redisClient.set('b', '2')
    await memoryClient.set('a', '1')
    await memoryClient.set('b', '2')
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti.del(['a', 'b'])
    mMulti.del(['a', 'b'])
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
    expect(await redisClient.get('a')).toEqual(await memoryClient.get('a'))
    expect(await redisClient.get('b')).toEqual(await memoryClient.get('b'))
  })
})

describe('keys', () => {
  test('returns all keys when pattern is *', async () => {
    await redisClient.set('a', '1')
    await redisClient.set('b', '2')
    await memoryClient.set('a', '1')
    await memoryClient.set('b', '2')
    expect((await redisClient.keys('*')).sort()).toEqual(
      (await memoryClient.keys('*')).sort()
    )
  })
  test('returns matching keys for prefix pattern', async () => {
    await redisClient.set('security:order:1', 'x')
    await redisClient.set('security:order:2', 'y')
    await redisClient.set('other:key', 'z')
    await memoryClient.set('security:order:1', 'x')
    await memoryClient.set('security:order:2', 'y')
    await memoryClient.set('other:key', 'z')
    expect((await redisClient.keys('security:order:*')).sort()).toEqual(
      (await memoryClient.keys('security:order:*')).sort()
    )
  })
  test('returns empty array when no keys match', async () => {
    await redisClient.set('other:key', 'z')
    await memoryClient.set('other:key', 'z')
    expect(await redisClient.keys('security:order:*')).toEqual(
      await memoryClient.keys('security:order:*')
    )
  })
  test('returns empty array when store is empty', async () => {
    expect(await redisClient.keys('*')).toEqual(await memoryClient.keys('*'))
  })
  test('single character wildcard ?', async () => {
    await redisClient.set('ha', '1')
    await redisClient.set('hb', '2')
    await redisClient.set('hab', '3')
    await memoryClient.set('ha', '1')
    await memoryClient.set('hb', '2')
    await memoryClient.set('hab', '3')
    expect((await redisClient.keys('h?')).sort()).toEqual(
      (await memoryClient.keys('h?')).sort()
    )
  })
})

describe('multi', () => {
  test('mix', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .set('val', 'bar')
      .hSet('hash', 'bar', 'boz')
      .hSet('hash', 'bar', 'baz')
      .hSet('hash', 'bar', 'baz')
      .hSet('hash', 'num', 10)
      .hSet('hash', { a: 20, b: 'true' })
      .hGetAll('hash')
    mMulti
      .set('val', 'bar')
      .hSet('hash', 'bar', 'boz')
      .hSet('hash', 'bar', 'baz')
      .hSet('hash', 'bar', 'baz')
      .hSet('hash', 'num', 10)
      .hSet('hash', { a: 20, b: 'true' })
      .hGetAll('hash')
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zAdd and zRangeWithScores', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zAdd('instruments:by_volume', { score: 2000, value: 'GOOG' })
      .zRangeWithScores('instruments:by_volume', 0, -1)
    mMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zAdd('instruments:by_volume', { score: 2000, value: 'GOOG' })
      .zRangeWithScores('instruments:by_volume', 0, -1)
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zAdd and zRangeWithScores REV', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zRangeWithScores('instruments:by_volume', 0, 0, { REV: true })
    mMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zRangeWithScores('instruments:by_volume', 0, 0, { REV: true })
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zAdd to multiple different keys in one multi', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_pct_change', { score: 0.415, value: 'TELIA' })
      .zAdd('instruments:by_lv_pct_change', { score: 0.415, value: 'TELIA' })
      .zAdd('instruments:by_volume', { score: 1068911, value: 'TELIA' })
      .zAdd('instruments:by_turnover', { score: 49104307, value: 'TELIA' })
    mMulti
      .zAdd('instruments:by_pct_change', { score: 0.415, value: 'TELIA' })
      .zAdd('instruments:by_lv_pct_change', { score: 0.415, value: 'TELIA' })
      .zAdd('instruments:by_volume', { score: 1068911, value: 'TELIA' })
      .zAdd('instruments:by_turnover', { score: 49104307, value: 'TELIA' })
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
    expect(
      await redisClient.zRangeWithScores('instruments:by_volume', 0, -1)
    ).toEqual(
      await memoryClient.zRangeWithScores('instruments:by_volume', 0, -1)
    )
    expect(
      await redisClient.zRangeWithScores('instruments:by_turnover', 0, -1)
    ).toEqual(
      await memoryClient.zRangeWithScores('instruments:by_turnover', 0, -1)
    )
  })
  test('zIncrBy', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zIncrBy('instruments:by_volume', 500, 'AAPL')
      .zRangeWithScores('instruments:by_volume', 0, -1)
    mMulti
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zIncrBy('instruments:by_volume', 500, 'AAPL')
      .zRangeWithScores('instruments:by_volume', 0, -1)
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zRem', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zRem('instruments:by_volume', 'AAPL')
      .zRangeWithScores('instruments:by_volume', 0, -1)
    mMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zRem('instruments:by_volume', 'AAPL')
      .zRangeWithScores('instruments:by_volume', 0, -1)
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zScore', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zScore('instruments:by_volume', 'AAPL')
    mMulti
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zScore('instruments:by_volume', 'AAPL')
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zRank', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zRank('instruments:by_volume', 'AAPL')
    mMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zRank('instruments:by_volume', 'AAPL')
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zCount', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zCount('instruments:by_volume', 1000, 2000)
    mMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zCount('instruments:by_volume', 1000, 2000)
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zRangeByScore', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zAdd('instruments:by_volume', { score: 2000, value: 'GOOG' })
      .zRangeByScore('instruments:by_volume', 1000, 2000)
    mMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zAdd('instruments:by_volume', { score: 2000, value: 'GOOG' })
      .zRangeByScore('instruments:by_volume', 1000, 2000)
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
  test('zRangeByScoreWithScores', async () => {
    const rMulti = redisClient.multi()
    const mMulti = memoryClient.multi()
    rMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zAdd('instruments:by_volume', { score: 2000, value: 'GOOG' })
      .zRangeByScoreWithScores('instruments:by_volume', 1000, 2000)
    mMulti
      .zAdd('instruments:by_volume', { score: 3000, value: 'MSFT' })
      .zAdd('instruments:by_volume', { score: 1000, value: 'AAPL' })
      .zAdd('instruments:by_volume', { score: 2000, value: 'GOOG' })
      .zRangeByScoreWithScores('instruments:by_volume', 1000, 2000)
    expect(await rMulti.exec()).toEqual(await mMulti.exec())
  })
})
