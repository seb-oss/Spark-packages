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

describe('Keys: del', () => {
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

describe('Keys: keys', () => {
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

describe('Keys: type', () => {
  test('get key type', async () => {
    await redisClient.set('str-key', 'value')
    await memoryClient.set('str-key', 'value')

    const redisType = await redisClient.type('str-key')
    const memType = await memoryClient.type('str-key')
    expect(redisType).toEqual(memType)
  })
})
