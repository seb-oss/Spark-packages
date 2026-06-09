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

describe('Hashes: hSet, hGet, hGetAll', () => {
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

describe('Hashes: hDel', () => {
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

describe('Hashes: hKeys', () => {
  test('get all keys from hash', async () => {
    const key = 'user'
    await redisClient.hSet(key, { name: 'Alice', age: '30', city: 'NYC' })
    await memoryClient.hSet(key, { name: 'Alice', age: '30', city: 'NYC' })

    const redisKeys = await redisClient.hKeys(key)
    const memKeys = await memoryClient.hKeys(key)
    expect(redisKeys.sort()).toEqual(memKeys.sort())
  })
})

describe('Hashes: hExists', () => {
  test('check if field exists', async () => {
    const key = 'user'
    await redisClient.hSet(key, 'name', 'Alice')
    await memoryClient.hSet(key, 'name', 'Alice')

    const redisExists = await redisClient.hExists(key, 'name')
    const memExists = await memoryClient.hExists(key, 'name')
    expect(redisExists).toEqual(memExists)

    const redisNotExists = await redisClient.hExists(key, 'missing')
    const memNotExists = await memoryClient.hExists(key, 'missing')
    expect(redisNotExists).toEqual(memNotExists)
  })
})
