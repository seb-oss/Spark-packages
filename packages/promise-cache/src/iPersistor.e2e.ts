import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'
import { createClient } from 'redis'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { InMemoryPersistor } from './inMemoryPersistor'

let redis: StartedRedisContainer
let redisClient: ReturnType<typeof createClient>
let memoryClient: InMemoryPersistor

beforeEach(async () => {
  redis = await new RedisContainer('redis:8-alpine').withReuse().start()

  redisClient = createClient({ url: redis.getConnectionUrl() })
  await redisClient.connect()

  memoryClient = new InMemoryPersistor()
}, 60_000)
afterEach(async () => {
  await redisClient.close()
  await redis.stop()
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
})
