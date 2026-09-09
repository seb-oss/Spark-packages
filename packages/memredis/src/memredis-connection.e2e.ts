import type { StartedRedisContainer } from '@testcontainers/redis'
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
import { startRedisContainer } from './start-redis-container'

let redis: StartedRedisContainer
let redisClient: ReturnType<typeof createClient>
let memoryClient: MemRedis

beforeAll(async () => {
  redis = await startRedisContainer()
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

describe('Connection: ping', () => {
  test('connection check', async () => {
    const redisPing = await redisClient.ping()
    const memPing = await memoryClient.ping()
    expect(redisPing).toEqual(memPing)
  })
})
