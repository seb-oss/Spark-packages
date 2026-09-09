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
let memRedisClient: MemRedis

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
  memRedisClient = new MemRedis()
})

afterEach(async () => {
  await redis.executeCliCmd('FLUSHALL')
})

describe('Pub/Sub: subscribe and publish', () => {
  test('subscribe and publish', async () => {
    const messages: string[] = []
    const subscriber = new MemRedis()
    const publisher = new MemRedis()

    await subscriber.subscribe('channel', (msg) => {
      messages.push(msg)
    })

    await publisher.publish('channel', 'hello')
    await publisher.publish('channel', 'world')

    await new Promise((resolve) => setTimeout(resolve, 100))

    await subscriber.unsubscribe('channel')
    expect(messages).toEqual(['hello', 'world'])
  })
})

describe('Pub/Sub: unsubscribe', () => {
  test('unsubscribe', async () => {
    const messages: string[] = []
    const subscriber = new MemRedis()
    const publisher = new MemRedis()

    await subscriber.subscribe('channel', (msg: string) => {
      messages.push(msg)
    })
    await publisher.publish('channel', 'before')

    await subscriber.unsubscribe('channel')
    await publisher.publish('channel', 'after')

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(messages).toEqual(['before'])
  })
})
