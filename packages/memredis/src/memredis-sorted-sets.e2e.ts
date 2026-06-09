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

describe('Sorted Sets: zAdd, zIncrBy, zRangeWithScores', () => {
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

describe('Sorted Sets: zScore', () => {
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

describe('Sorted Sets: zRank', () => {
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

describe('Sorted Sets: zCount', () => {
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

describe('Sorted Sets: zRangeByScore', () => {
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

describe('Sorted Sets: zRangeByScoreWithScores', () => {
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

describe('Sorted Sets: zCard', () => {
  test('get sorted set cardinality', async () => {
    const key = 'scores'
    await redisClient.zAdd(key, [
      { score: 1, value: 'a' },
      { score: 2, value: 'b' },
    ])
    await memoryClient.zAdd(key, [
      { score: 1, value: 'a' },
      { score: 2, value: 'b' },
    ])

    const redisCard = await redisClient.zCard(key)
    const memCard = await memoryClient.zCard(key)
    expect(redisCard).toEqual(memCard)
  })
})
