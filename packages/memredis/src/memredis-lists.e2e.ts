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

describe('Lists: lLen', () => {
  test('get list length', async () => {
    const key = 'queue'
    await redisClient.lPush(key, ['a', 'b', 'c'])
    await memoryClient.lPush(key, ['a', 'b', 'c'])

    const redisLen = await redisClient.lLen(key)
    const memLen = await memoryClient.lLen(key)
    expect(redisLen).toEqual(memLen)
  })
})

describe('Lists: lIndex', () => {
  test('get element at index', async () => {
    const key = 'queue'
    await redisClient.lPush(key, ['a', 'b', 'c'])
    await memoryClient.lPush(key, ['a', 'b', 'c'])

    const redisVal = await redisClient.lIndex(key, 0)
    const memVal = await memoryClient.lIndex(key, 0)
    expect(redisVal).toEqual(memVal)
  })
})
