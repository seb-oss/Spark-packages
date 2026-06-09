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

describe('Strings: set, get', () => {
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

describe('Strings: getEx', () => {
  test('get with expiration', async () => {
    const key = 'test-key'
    await redisClient.set(key, 'value')
    await memoryClient.set(key, 'value')

    const redisResult = await redisClient.getEx(key, { EX: 10 })
    const memResult = await memoryClient.getEx(key, { EX: 10 })
    expect(redisResult).toEqual(memResult)
  })
})

describe('Strings: append', () => {
  test('append to string', async () => {
    const key = 'concat'
    await redisClient.set(key, 'Hello')
    await memoryClient.set(key, 'Hello')

    const redisLen = await redisClient.append(key, ' World')
    const memLen = await memoryClient.append(key, ' World')
    expect(redisLen).toEqual(memLen)

    expect(await redisClient.get(key)).toEqual(await memoryClient.get(key))
  })
})
