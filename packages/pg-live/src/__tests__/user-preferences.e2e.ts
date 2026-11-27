import '@sebspark/expect-eventually'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
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
  defineTable,
  type Listener,
  live,
  writeAndNotify,
} from '../index'

// The use case: a service updates user preferences, and every worker that
// decides on incoming events whether to notify a user keeps all preferences
// in memory. In each test, the producer pool plays the service and each new
// pool + listener plays a worker process.

type UserPrefs = {
  user_id: string
  channels: string[]
  quiet_hours: { from: string; to: string } | null
}

const userPrefs = defineTable<UserPrefs>({
  table: 'user_preferences',
  key: 'user_id',
})

const IMAGE_POSTGRES =
  'postgres:19-alpine@sha256:cac45fb483caee3668946088a1c0532db89d5285c28dbfeac889b4068296e06f'

// Polling for changes that arrive through Postgres
const withinFiveSeconds = { timeout: 5000, interval: 10 }

let container: StartedPostgreSqlContainer
let connectionString: string
let producer: Pool
// The workers' pool for reads. Not part of pg-live, so set up outside the tests.
let pool: Pool
// Listeners the tests create, closed after each test
let listener: Listener | undefined
let otherListener: Listener | undefined

beforeAll(async () => {
  container = await new PostgreSqlContainer(IMAGE_POSTGRES).start()
  connectionString = container.getConnectionUri()
  producer = new Pool({ connectionString })
  await producer.query(`
    CREATE TABLE user_preferences (
      user_id text PRIMARY KEY,
      channels text[] NOT NULL,
      quiet_hours jsonb
    )
  `)
})

afterAll(async () => {
  await producer?.end()
  await container?.stop()
})

beforeEach(async () => {
  pool = new Pool({ connectionString })
  await producer.query('TRUNCATE user_preferences')
})

afterEach(async () => {
  await listener?.close()
  await otherListener?.close()
  listener = undefined
  otherListener = undefined
  await pool.end()
  await producer.query(
    'ALTER TABLE IF EXISTS user_preferences_away RENAME TO user_preferences'
  )
  await producer.query(
    'ALTER TABLE user_preferences DROP COLUMN IF EXISTS locale'
  )
})

// Ends every LISTEN session, as a network failure or a database restart would.
// Returns how many sessions it ended.
const dropListenerConnections = async () => {
  const { rowCount } = await producer.query(`
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity
    WHERE query ILIKE 'LISTEN%' AND pid <> pg_backend_pid()
  `)
  return rowCount
}

describe('a worker starting up', () => {
  it('rejects, and stops listening, when the rows cannot be loaded', async () => {
    const missing = defineTable<UserPrefs>({
      table: 'no_such_table',
      key: 'user_id',
    })
    listener = createListener({ connectionString })

    await expect(live(missing, { pool, listener })).rejects.toThrow(
      'relation "no_such_table" does not exist'
    )

    // The listener's session ran UNLISTEN for the channel as its last query
    const { rows } = await producer.query(
      `SELECT query FROM pg_stat_activity WHERE query ILIKE '%LISTEN%' AND pid <> pg_backend_pid()`
    )
    expect(rows).toEqual([{ query: 'UNLISTEN "no_such_table_changed"' }])
  })

  it('has every user preference in memory when live() resolves', async () => {
    await producer.query(`
      INSERT INTO user_preferences (user_id, channels, quiet_hours) VALUES
        ('anna', '{push}', '{"from": "22:00", "to": "07:00"}'),
        ('bob', '{push,email}', NULL)
    `)
    listener = createListener({ connectionString })

    const prefs = await live(userPrefs, { pool, listener })

    expect(prefs.get('anna')).toEqual({
      user_id: 'anna',
      channels: ['push'],
      quiet_hours: { from: '22:00', to: '07:00' },
    })
    expect(prefs.get('bob')).toEqual({
      user_id: 'bob',
      channels: ['push', 'email'],
      quiet_hours: null,
    })
    expect(prefs.has('nobody')).toBe(false)
  })
})

describe('with anna and bob in the table', () => {
  beforeEach(async () => {
    await producer.query(`
      INSERT INTO user_preferences (user_id, channels, quiet_hours) VALUES
        ('anna', '{push}', '{"from": "22:00", "to": "07:00"}'),
        ('bob', '{push,email}', NULL)
    `)
  })

  // Their rows, as live() holds them
  const anna: UserPrefs = {
    user_id: 'anna',
    channels: ['push'],
    quiet_hours: { from: '22:00', to: '07:00' },
  }
  const bob: UserPrefs = {
    user_id: 'bob',
    channels: ['push', 'email'],
    quiet_hours: null,
  }

  describe('a user changing preferences through writeAndNotify', () => {
    it('reaches every worker', async () => {
      listener = createListener({ connectionString })
      otherListener = createListener({ connectionString })
      const worker1 = await live(userPrefs, { pool, listener })
      const worker2 = await live(userPrefs, { pool, listener: otherListener })

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET channels = '{email}' WHERE user_id = 'anna'`
        )
        return ['anna'] // the keys of the rows this transaction changed
      })

      await expect(() => worker1.get('anna')?.channels)
        .eventually(withinFiveSeconds)
        .toEqual(['email'])
      await expect(() => worker2.get('anna')?.channels)
        .eventually(withinFiveSeconds)
        .toEqual(['email'])
    })

    it('emits update with the new row', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const updated: UserPrefs[] = []
      prefs.on('update', (row) => updated.push(row))

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET channels = '{email}' WHERE user_id = 'anna'`
        )
        return ['anna']
      })

      await expect(() => updated)
        .eventually(withinFiveSeconds)
        .toEqual([{ ...anna, channels: ['email'] }])
    })

    it('emits add for a new user', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const added: UserPrefs[] = []
      prefs.on('add', (row) => added.push(row))

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `INSERT INTO user_preferences (user_id, channels) VALUES ('cecilia', '{sms}')`
        )
        return ['cecilia']
      })

      const cecilia = {
        user_id: 'cecilia',
        channels: ['sms'],
        quiet_hours: null,
      }
      await expect(() => added)
        .eventually(withinFiveSeconds)
        .toEqual([cecilia])
      expect(prefs.get('cecilia')).toEqual(cecilia)
    })

    it('emits delete with the key for a removed user', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const deleted: unknown[] = []
      prefs.on('delete', (userId) => deleted.push(userId))

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(`DELETE FROM user_preferences WHERE user_id = 'bob'`)
        return ['bob']
      })

      await expect(() => deleted)
        .eventually(withinFiveSeconds)
        .toEqual(['bob'])
      expect(prefs.has('bob')).toBe(false)
    })

    it('emits every add, update and delete on change, with its type', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const changes: unknown[][] = []
      prefs.on('change', (type, payload) => changes.push([type, payload]))

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `INSERT INTO user_preferences (user_id, channels) VALUES ('cecilia', '{sms}')`
        )
        await tx.query(
          `UPDATE user_preferences SET channels = '{email}' WHERE user_id = 'anna'`
        )
        await tx.query(`DELETE FROM user_preferences WHERE user_id = 'bob'`)
        return ['cecilia', 'anna', 'bob']
      })

      await expect(() => changes)
        .eventually(withinFiveSeconds)
        .toHaveLength(3)
      expect(changes).toEqual(
        expect.arrayContaining([
          ['add', { user_id: 'cecilia', channels: ['sms'], quiet_hours: null }],
          ['update', { ...anna, channels: ['email'] }],
          ['delete', 'bob'],
        ])
      )
    })

    it('reaches workers even when the row is too big for a notification', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      // Postgres rejects notifications of 8000 bytes or more
      const quietHours = { from: '22:00', to: 'x'.repeat(10_000) }

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET quiet_hours = $1 WHERE user_id = 'anna'`,
          [quietHours]
        )
        return ['anna']
      })

      await expect(() => prefs.get('anna')?.quiet_hours)
        .eventually(withinFiveSeconds)
        .toEqual(quietHours)
    })

    it('changes nothing when the transaction rolls back', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const changes: unknown[][] = []
      prefs.on('change', (type, payload) => changes.push([type, payload]))

      await expect(
        writeAndNotify(producer, userPrefs, async (tx) => {
          await tx.query(
            `UPDATE user_preferences SET channels = '{sms}' WHERE user_id = 'anna'`
          )
          throw new Error('rejected by the service')
        })
      ).rejects.toThrow('rejected by the service')

      // A later committed change proves notifications are flowing
      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET channels = '{sms}' WHERE user_id = 'bob'`
        )
        return ['bob']
      })
      await expect(() => changes)
        .eventually(withinFiveSeconds)
        .toEqual([['update', { ...bob, channels: ['sms'] }]])
      expect(prefs.get('anna')).toEqual(anna)
    })

    it('rejects with the original error when the connection breaks mid-transaction', async () => {
      // The transaction's own connection is killed, so ROLLBACK fails too
      await expect(
        writeAndNotify(producer, userPrefs, async (tx) => {
          await tx.query('SELECT pg_terminate_backend(pg_backend_pid())')
          return ['anna']
        })
      ).rejects.toThrow('terminating connection due to administrator command')

      // The broken connection is not reused: the next write works
      await expect(
        writeAndNotify(producer, userPrefs, async (tx) => {
          await tx.query(
            `UPDATE user_preferences SET channels = '{sms}' WHERE user_id = 'anna'`
          )
          return ['anna']
        })
      ).resolves.toBeUndefined()
    })

    it('emits nothing when the row did not actually change', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const changes: unknown[][] = []
      prefs.on('change', (type, payload) => changes.push([type, payload]))

      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET channels = '{push}' WHERE user_id = 'anna'`
        )
        return ['anna']
      })

      // A later committed change proves notifications are flowing
      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET channels = '{sms}' WHERE user_id = 'bob'`
        )
        return ['bob']
      })
      await expect(() => changes)
        .eventually(withinFiveSeconds)
        .toEqual([['update', { ...bob, channels: ['sms'] }]])
    })
  })

  describe('a worker that loses its connection', () => {
    it('catches up on changes it missed, without reporting an error', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const changes: unknown[][] = []
      prefs.on('change', (type, payload) => changes.push([type, payload]))
      const errors: unknown[] = []
      prefs.on('error', (error) => errors.push(error))

      expect(await dropListenerConnections()).toBe(1)
      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET channels = '{sms}' WHERE user_id = 'anna'`
        )
        return ['anna']
      })

      await expect(() => changes)
        .eventually(withinFiveSeconds)
        .toEqual([['update', { ...anna, channels: ['sms'] }]])
      expect(errors).toEqual([])
    })
  })

  describe('a worker that cannot load the rows again after reconnecting', () => {
    it('reports the failure on error', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const errors: unknown[] = []
      prefs.on('error', (error) => errors.push(error))

      // While the worker is disconnected, the table goes away
      await producer.query(
        'ALTER TABLE user_preferences RENAME TO user_preferences_away'
      )
      expect(await dropListenerConnections()).toBe(1)

      await expect(() => errors.map(String))
        .eventually(withinFiveSeconds)
        .toEqual(['error: relation "user_preferences" does not exist'])
    })
  })

  describe('a column added while workers are running', () => {
    it('keeps serving rows, with the column on rows changed since', async () => {
      listener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })

      await producer.query(
        'ALTER TABLE user_preferences ADD COLUMN locale text'
      )
      // A producer that does not know about the column yet
      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET channels = '{sms}' WHERE user_id = 'anna'`
        )
        return ['anna']
      })

      await expect(() => prefs.get('anna'))
        .eventually(withinFiveSeconds)
        .toEqual({ ...anna, channels: ['sms'], locale: null })
      expect(prefs.get('bob')).toEqual(bob)
      expect(prefs.get('bob')).not.toHaveProperty('locale')
    })
  })

  describe('a worker shutting down', () => {
    it('stops applying changes after close()', async () => {
      listener = createListener({ connectionString })
      // A second worker that keeps running, to see when the change is delivered
      otherListener = createListener({ connectionString })
      const prefs = await live(userPrefs, { pool, listener })
      const other = await live(userPrefs, { pool, listener: otherListener })
      const changes: unknown[][] = []
      prefs.on('change', (type, payload) => changes.push([type, payload]))

      await prefs.close()
      await writeAndNotify(producer, userPrefs, async (tx) => {
        await tx.query(
          `UPDATE user_preferences SET channels = '{sms}' WHERE user_id = 'anna'`
        )
        return ['anna']
      })

      await expect(() => other.get('anna')?.channels)
        .eventually(withinFiveSeconds)
        .toEqual(['sms'])
      expect(prefs.get('anna')).toEqual(anna)
      expect(changes).toEqual([])
    })
  })
})
