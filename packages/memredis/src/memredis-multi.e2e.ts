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
import { MemRedis } from './memredis'

let redis: StartedRedisContainer
let redisClient: ReturnType<typeof createClient>
let memoryClient: MemRedis

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
  memoryClient = new MemRedis()
})

afterEach(async () => {
  await redis.executeCliCmd('FLUSHALL')
})

describe('Multi: del in batch', () => {
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

describe('Multi: mixed operations', () => {
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
})

describe('Multi: sorted set operations', () => {
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

describe('Multi: exec', () => {
  test('multi and exec', async () => {
    const redisMulti = redisClient.multi()
    const memMulti = memoryClient.multi()

    redisMulti.set('key1', 'val1').set('key2', 'val2').get('key1')
    memMulti.set('key1', 'val1').set('key2', 'val2').get('key1')

    const redisResults = await redisMulti.exec()
    const memResults = await memMulti.exec()

    expect(redisResults).toEqual(memResults)
  })
})
