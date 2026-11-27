import '@sebspark/expect-eventually'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { Pool } from 'pg'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import {
  createListener,
  defineLiveTable,
  type Listener,
  live,
  writeAndNotify,
} from '../index'

// The same use case as pg-live, with a Drizzle schema: camelCase in the code,
// snake_case in the database.

const userPreferences = pgTable('user_preferences', {
  userId: text().primaryKey(),
  channels: text().array().notNull(),
  quietHours: jsonb().$type<{ from: string; to: string }>(),
  updatedAt: timestamp({ withTimezone: true }).notNull(),
})

const userPrefs = defineLiveTable(userPreferences, { casing: 'snake_case' })

const IMAGE_POSTGRES =
  'postgres:19-alpine@sha256:cac45fb483caee3668946088a1c0532db89d5285c28dbfeac889b4068296e06f'

// Polling for changes that arrive through Postgres
const withinFiveSeconds = { timeout: 5000, interval: 10 }

let container: StartedPostgreSqlContainer
let connectionString: string
let producerPool: Pool
let producer: ReturnType<typeof drizzle>
// The workers' database client. Not part of drizzle-live, so set up outside the tests.
let pool: Pool
let db: ReturnType<typeof drizzle>
// The listener a test creates, closed after each test
let listener: Listener | undefined

beforeAll(async () => {
  container = await new PostgreSqlContainer(IMAGE_POSTGRES).start()
  connectionString = container.getConnectionUri()
  producerPool = new Pool({ connectionString })
  producer = drizzle({ client: producerPool, casing: 'snake_case' })
  await producerPool.query(`
    CREATE TABLE user_preferences (
      user_id text PRIMARY KEY,
      channels text[] NOT NULL,
      quiet_hours jsonb,
      updated_at timestamptz NOT NULL
    )
  `)
})

beforeEach(async () => {
  pool = new Pool({ connectionString })
  db = drizzle({ client: pool, casing: 'snake_case' })
  await producerPool.query('TRUNCATE user_preferences')
})

afterEach(async () => {
  await listener?.close()
  listener = undefined
  await pool.end()
})

afterAll(async () => {
  await producerPool?.end()
  await container?.stop()
})

describe('a worker starting up', () => {
  it('has every row, with camelCase keys and Date values like a Drizzle select', async () => {
    await producer.insert(userPreferences).values({
      userId: 'anna',
      channels: ['push'],
      quietHours: { from: '22:00', to: '07:00' },
      updatedAt: new Date('2026-11-01T08:00:00Z'),
    })
    listener = createListener({ connectionString })

    const prefs = await live(db, userPrefs, { listener })

    expect(prefs.get('anna')).toEqual({
      userId: 'anna',
      channels: ['push'],
      quietHours: { from: '22:00', to: '07:00' },
      updatedAt: new Date('2026-11-01T08:00:00Z'),
    })
  })
})

describe('with anna and bob in the table', () => {
  beforeEach(async () => {
    await producer.insert(userPreferences).values([
      {
        userId: 'anna',
        channels: ['push'],
        quietHours: { from: '22:00', to: '07:00' },
        updatedAt: new Date('2026-11-01T08:00:00Z'),
      },
      {
        userId: 'bob',
        channels: ['push', 'email'],
        quietHours: null,
        updatedAt: new Date('2026-11-02T08:00:00Z'),
      },
    ])
  })

  describe('a user changing preferences through writeAndNotify', () => {
    it('reaches the worker with camelCase keys and Date values', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(db, userPrefs, { listener })

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx
          .update(userPreferences)
          .set({
            channels: ['sms'],
            updatedAt: new Date('2026-11-03T08:00:00Z'),
          })
          .where(eq(userPreferences.userId, 'anna'))
        return ['anna'] // the keys of the rows this transaction changed
      })

      await expect(() => prefs.get('anna'))
        .eventually(withinFiveSeconds)
        .toEqual({
          userId: 'anna',
          channels: ['sms'],
          quietHours: { from: '22:00', to: '07:00' },
          updatedAt: new Date('2026-11-03T08:00:00Z'),
        })
    })

    it('reaches the worker the same way when the row is too big for a notification', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(db, userPrefs, { listener })
      // Postgres rejects notifications of 8000 bytes or more
      const quietHours = { from: '22:00', to: 'x'.repeat(10_000) }

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx
          .update(userPreferences)
          .set({ quietHours })
          .where(eq(userPreferences.userId, 'anna'))
        return ['anna']
      })

      await expect(() => prefs.get('anna'))
        .eventually(withinFiveSeconds)
        .toEqual({
          userId: 'anna',
          channels: ['push'],
          quietHours,
          updatedAt: new Date('2026-11-01T08:00:00Z'),
        })
    })

    it('emits delete with the key for a removed user', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(db, userPrefs, { listener })
      const deleted: string[] = []
      prefs.on('delete', (userId) => deleted.push(userId))

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx
          .delete(userPreferences)
          .where(eq(userPreferences.userId, 'bob'))
        return ['bob']
      })

      await expect(() => deleted)
        .eventually(withinFiveSeconds)
        .toEqual(['bob'])
      expect(prefs.has('bob')).toBe(false)
    })

    it('changes nothing when the transaction rolls back', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(db, userPrefs, { listener })

      await expect(
        writeAndNotify(producer, userPrefs, async (tx) => {
          await tx
            .update(userPreferences)
            .set({ channels: ['sms'] })
            .where(eq(userPreferences.userId, 'anna'))
          throw new Error('rejected by the service')
        })
      ).rejects.toThrow('rejected by the service')

      // A later committed change proves notifications are flowing
      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx
          .update(userPreferences)
          .set({ channels: ['sms'] })
          .where(eq(userPreferences.userId, 'bob'))
        return ['bob']
      })
      await expect(() => prefs.get('bob')?.channels)
        .eventually(withinFiveSeconds)
        .toEqual(['sms'])
      expect(prefs.get('anna')?.channels).toEqual(['push'])
    })
  })
})
