import '@sebspark/expect-eventually'
import {
  RedisContainer,
  type StartedRedisContainer,
} from '@testcontainers/redis'
import { createClient, type RedisClientType } from 'redis'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { defineCollection, type LiveCollection, live } from '../index'

// The use case: a service saves user preferences, and every worker that
// decides on incoming events whether to notify a user reads them from memory.
// Each Redis client below plays one process.

type UserPrefs = {
  userId: string
  channels: string[]
  quietHours: { from: string; to: string } | null
}

const userPrefs = defineCollection<UserPrefs>({
  namespace: 'user_prefs',
  key: 'userId',
})

const IMAGE_REDIS =
  'redis:8.8.4-alpine@sha256:ab669f1420eaa05360a417b24f3bd210c9272e2c79a4bb35d3e50b4bfd50dbee'

// Polling for changes that arrive through Redis
const withinFiveSeconds = { timeout: 5000, interval: 10 }

type Client = RedisClientType

let container: StartedRedisContainer
let url: string
// Inspects and prepares Redis directly, as an operator would
let admin: Client
// The clients of two processes. Not part of redis-live, so set up outside the tests.
let client: Client
let otherClient: Client
// Live collections the tests create, closed after each test
let prefs: LiveCollection<UserPrefs> | undefined
let other: LiveCollection<UserPrefs> | undefined
let third: LiveCollection<UserPrefs> | undefined

beforeAll(async () => {
  container = await new RedisContainer(IMAGE_REDIS).start()
  url = container.getConnectionUrl()
  admin = await createClient({ url }).connect()
})

afterAll(async () => {
  await admin?.quit()
  await container?.stop()
})

beforeEach(async () => {
  await admin.flushAll()
  // Expired-key events, which entries with an expiration rely on
  await admin.configSet('notify-keyspace-events', 'Ex')
  await admin.configSet('maxmemory', '0')
  client = await createClient({ url }).connect()
  otherClient = await createClient({ url }).connect()
})

afterEach(async () => {
  await prefs?.close()
  await other?.close()
  await third?.close()
  prefs = undefined
  other = undefined
  third = undefined
  await client.quit()
  await otherClient.quit()
})

describe('a process starting up', () => {
  it('has every entry in memory when live() resolves', async () => {
    // Entries are stored as JSON under <namespace>:<id>
    await admin.set(
      'user_prefs:anna',
      JSON.stringify({
        userId: 'anna',
        channels: ['push'],
        quietHours: { from: '22:00', to: '07:00' },
      })
    )
    await admin.set(
      'user_prefs:bob',
      JSON.stringify({ userId: 'bob', channels: ['email'], quietHours: null })
    )

    prefs = await live(userPrefs, { client })

    expect(prefs.get('anna')).toEqual({
      userId: 'anna',
      channels: ['push'],
      quietHours: { from: '22:00', to: '07:00' },
    })
    expect(prefs.get('bob')).toEqual({
      userId: 'bob',
      channels: ['email'],
      quietHours: null,
    })
    expect(prefs.has('nobody')).toBe(false)
    expect(prefs.get('nobody')).toBeNull()
  })
})

describe('with anna and bob stored', () => {
  const anna: UserPrefs = {
    userId: 'anna',
    channels: ['push'],
    quietHours: { from: '22:00', to: '07:00' },
  }
  const bob: UserPrefs = {
    userId: 'bob',
    channels: ['email'],
    quietHours: null,
  }

  beforeEach(async () => {
    await admin.set('user_prefs:anna', JSON.stringify(anna))
    await admin.set('user_prefs:bob', JSON.stringify(bob))
  })

  describe('set', () => {
    it('is visible to get at once, before Redis has answered', async () => {
      prefs = await live(userPrefs, { client })

      const written = prefs.set({ ...anna, channels: ['sms'] })

      expect(prefs.get('anna')?.channels).toEqual(['sms'])
      await written
    })

    it('stores the entry in Redis as JSON under <namespace>:<id>', async () => {
      prefs = await live(userPrefs, { client })

      await prefs.set({ ...anna, channels: ['sms'] })

      expect(JSON.parse((await admin.get('user_prefs:anna')) ?? '')).toEqual({
        ...anna,
        channels: ['sms'],
      })
    })

    it('reaches every process', async () => {
      prefs = await live(userPrefs, { client })
      other = await live(userPrefs, { client: otherClient })

      await prefs.set({ ...anna, channels: ['sms'] })

      await expect(() => other?.get('anna')?.channels)
        .eventually(withinFiveSeconds)
        .toEqual(['sms'])
    })

    it('emits update in every process, and add for a new entry', async () => {
      prefs = await live(userPrefs, { client })
      other = await live(userPrefs, { client: otherClient })
      const updated: UserPrefs[] = []
      const added: UserPrefs[] = []
      other.on('update', (entry) => updated.push(entry))
      other.on('add', (entry) => added.push(entry))

      await prefs.set({ ...anna, channels: ['sms'] })
      await prefs.set({
        userId: 'cecilia',
        channels: ['push'],
        quietHours: null,
      })

      await expect(() => updated)
        .eventually(withinFiveSeconds)
        .toEqual([{ ...anna, channels: ['sms'] }])
      await expect(() => added)
        .eventually(withinFiveSeconds)
        .toEqual([{ userId: 'cecilia', channels: ['push'], quietHours: null }])
    })

    it('emits in the writing process at once', async () => {
      prefs = await live(userPrefs, { client })
      const updated: UserPrefs[] = []
      prefs.on('update', (entry) => updated.push(entry))

      const written = prefs.set({ ...anna, channels: ['sms'] })

      expect(updated).toEqual([{ ...anna, channels: ['sms'] }])
      await written
    })

    it('emits nothing when the entry did not change', async () => {
      prefs = await live(userPrefs, { client })
      other = await live(userPrefs, { client: otherClient })
      const changes: unknown[][] = []
      other.on('change', (type, payload) => changes.push([type, payload]))

      await prefs.set({ ...anna })

      // A later change proves messages are flowing
      await prefs.set({ ...bob, channels: ['sms'] })
      await expect(() => changes)
        .eventually(withinFiveSeconds)
        .toEqual([['update', { ...bob, channels: ['sms'] }]])
    })
  })

  describe('del', () => {
    it('removes the entry in every process and emits delete with the id', async () => {
      prefs = await live(userPrefs, { client })
      other = await live(userPrefs, { client: otherClient })
      const deleted: unknown[] = []
      other.on('delete', (id) => deleted.push(id))

      await prefs.del('bob')

      expect(prefs.has('bob')).toBe(false)
      await expect(() => deleted)
        .eventually(withinFiveSeconds)
        .toEqual(['bob'])
      expect(other.has('bob')).toBe(false)
      expect(await admin.exists('user_prefs:bob')).toBe(0)
    })
  })

  describe('an entry set with an expiration', () => {
    it('is visible to get at once, before Redis has answered', async () => {
      prefs = await live(userPrefs, { client })

      const written = prefs.set(
        { ...anna, channels: ['sms'] },
        { expiration: { type: 'EX', value: 60 } }
      )

      expect(prefs.get('anna')?.channels).toEqual(['sms'])
      await written
    })

    it('disappears in every process when it expires, and emits expired', async () => {
      prefs = await live(userPrefs, { client })
      other = await live(userPrefs, { client: otherClient })
      const expired: unknown[] = []
      other.on('expired', (id) => expired.push(id))

      await prefs.set(
        { ...anna, channels: ['sms'] },
        { expiration: { type: 'PX', value: 200 } }
      )

      await expect(() => expired)
        .eventually(withinFiveSeconds)
        .toEqual(['anna'])
      expect(other.has('anna')).toBe(false)
      await expect(() => prefs?.has('anna'))
        .eventually(withinFiveSeconds)
        .toBe(false)
    })

    it('is refused when Redis does not send expired-key events, and memory goes back', async () => {
      await admin.configSet('notify-keyspace-events', '')
      prefs = await live(userPrefs, { client })
      const errors: unknown[] = []
      prefs.on('error', (error) => errors.push(error))

      await prefs.set(
        { ...anna, channels: ['sms'] },
        { expiration: { type: 'PX', value: 200 } }
      )

      expect(errors.map(String)).toEqual([
        expect.stringContaining('notify-keyspace-events'),
      ])
      expect(prefs.get('anna')).toEqual(anna)
      expect(await admin.pTTL('user_prefs:anna')).toBe(-1)
    })

    it('rejects the refusal when nobody listens for errors', async () => {
      await admin.configSet('notify-keyspace-events', '')
      prefs = await live(userPrefs, { client })

      await expect(
        prefs.set(
          { ...anna, channels: ['sms'] },
          { expiration: { type: 'PX', value: 200 } }
        )
      ).rejects.toThrow('notify-keyspace-events')
      expect(prefs.get('anna')).toEqual(anna)
    })
  })

  describe('a write Redis refuses', () => {
    it('is reported on error, and memory goes back to what Redis has', async () => {
      prefs = await live(userPrefs, { client })
      const errors: unknown[] = []
      prefs.on('error', (error) => errors.push(error))
      // Redis now refuses every write
      await admin.configSet('maxmemory', '1')

      await prefs.set({ ...anna, channels: ['sms'] })

      expect(errors.map(String)).toEqual([
        expect.stringContaining('OOM command not allowed'),
      ])
      expect(prefs.get('anna')).toEqual(anna)
    })

    it('rejects when nobody listens for errors', async () => {
      prefs = await live(userPrefs, { client })
      await admin.configSet('maxmemory', '1')

      await expect(prefs.set({ ...anna, channels: ['sms'] })).rejects.toThrow(
        'OOM command not allowed'
      )
      expect(prefs.get('anna')).toEqual(anna)
    })
  })

  describe('a process that loses its subscription', () => {
    it('catches up on changes it missed, without reporting an error', async () => {
      prefs = await live(userPrefs, { client })
      other = await live(userPrefs, { client: otherClient })
      const errors: unknown[] = []
      prefs.on('error', (error) => errors.push(error))

      // Ends both processes' subscribing connections, as a network failure would
      expect(await admin.clientKill({ filter: 'TYPE', type: 'pubsub' })).toBe(2)
      await other.set({ ...anna, channels: ['sms'] })

      await expect(() => prefs?.get('anna')?.channels)
        .eventually(withinFiveSeconds)
        .toEqual(['sms'])
      expect(errors).toEqual([])
    })
  })

  describe('a process shutting down', () => {
    it('waits for pending writes before close() resolves', async () => {
      prefs = await live(userPrefs, { client })

      void prefs.set({ ...anna, channels: ['sms'] })
      await prefs.close()

      expect(JSON.parse((await admin.get('user_prefs:anna')) ?? '')).toEqual({
        ...anna,
        channels: ['sms'],
      })
    })

    it('stops applying changes after close()', async () => {
      prefs = await live(userPrefs, { client })
      other = await live(userPrefs, { client: otherClient })
      // A third process that keeps running, to see when the change is delivered
      third = await live(userPrefs, { client: otherClient })
      const changes: unknown[][] = []
      prefs.on('change', (type, payload) => changes.push([type, payload]))

      await prefs.close()
      await other.set({ ...anna, channels: ['sms'] })

      await expect(() => third?.get('anna')?.channels)
        .eventually(withinFiveSeconds)
        .toEqual(['sms'])
      expect(prefs.get('anna')).toEqual(anna)
      expect(changes).toEqual([])
    })
  })
})
