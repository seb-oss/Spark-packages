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

describe('Sets: sCard', () => {
  test('get set cardinality', async () => {
    const key = 'tags'
    await redisClient.sAdd(key, ['a', 'b', 'c'])
    await memoryClient.sAdd(key, ['a', 'b', 'c'])

    const redisCard = await redisClient.sCard(key)
    const memCard = await memoryClient.sCard(key)
    expect(redisCard).toEqual(memCard)
  })
})

describe('Sets: sIsMember', () => {
  test('check membership', async () => {
    const key = 'tags'
    await redisClient.sAdd(key, ['a', 'b', 'c'])
    await memoryClient.sAdd(key, ['a', 'b', 'c'])

    const redisIsMem = await redisClient.sIsMember(key, 'a')
    const memIsMem = await memoryClient.sIsMember(key, 'a')
    expect(redisIsMem).toEqual(memIsMem)

    const redisNotMem = await redisClient.sIsMember(key, 'z')
    const memNotMem = await memoryClient.sIsMember(key, 'z')
    expect(redisNotMem).toEqual(memNotMem)
  })
})
