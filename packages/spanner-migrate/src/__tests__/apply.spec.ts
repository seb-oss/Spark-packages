import { type Database, Spanner } from '@google-cloud/spanner'
import type { ExecuteSqlRequest, Transaction } from '@google-cloud/spanner/build/src/transaction'
import { applyUp, applyDown } from '../apply'
import { Migration } from '../types'

describe('apply.ts', () => {
  let db: jest.Mocked<Database>

  beforeEach(() => {
    // Assume `Database` is mocked globally
    db = new Spanner().instance('my-instance').database('my-database') as jest.Mocked<Database>
    jest.clearAllMocks()
  })

  describe('applyUp', () => {
    it('should apply the up script and record the migration', async () => {
      const migration: Migration = {
        id: '20250119T143000_add_users_table',
        description: 'Add users table',
        up: 'CREATE TABLE users (id STRING NOT NULL) PRIMARY KEY (id)',
        down: 'DROP TABLE users',
      }

      db.run.mockImplementation(async () => [])

      await applyUp(db, migration)

      expect(db.updateSchema).toHaveBeenCalledWith(migration.up)

      const [transaction] = await db.getTransaction()
      
      expect(transaction.runUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('INSERT INTO migrations'),
          params: migration,
        })
      )
    })

    it('should run one query per script in the migration', async () => {
      const migration: Migration = {
        id: '20250119T143000_add_a_and_b_tables',
        description: 'Add a and b tables',
        up: 'CREATE TABLE a (id STRING NOT NULL) PRIMARY KEY (id); CREATE TABLE b (id STRING NOT NULL) PRIMARY KEY (id);',
        down: 'DROP TABLE a; DROP table b;',
      }

      db.run.mockImplementation(async () => [[]])

      await applyUp(db, migration)

      expect(db.updateSchema).toHaveBeenCalledWith('CREATE TABLE a (id STRING NOT NULL) PRIMARY KEY (id)')
      expect(db.updateSchema).toHaveBeenCalledWith('CREATE TABLE b (id STRING NOT NULL) PRIMARY KEY (id)')

      const [transaction] = (await db.getTransaction())

      expect(transaction.runUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('INSERT INTO migrations'),
          params: migration,
        })
      )
    })

    it('should throw an error if the up script fails', async () => {
      const migration: Migration = {
        id: '20250119T143000_add_users_table',
        description: 'Add users table',
        up: 'CREATE TABLE users (id STRING NOT NULL) PRIMARY KEY (id)',
        down: 'DROP TABLE users',
      }

      db.updateSchema.mockImplementation(async () => {
        throw new Error('Database error')
      })

      await expect(applyUp(db, migration)).rejects.toThrow(
        `Failed to apply migration ${migration.id}: Database error`
      )
    })
  })

  describe('applyDown', () => {
    it('should roll back the last migration and delete its record', async () => {
      const lastMigration: Migration = {
        id: '20250119T143000_add_users_table',
        description: 'Add users table',
        up: 'CREATE TABLE users (id STRING NOT NULL) PRIMARY KEY (id)',
        down: 'DROP TABLE users',
        appliedAt: new Date(),
      }

      db.run.mockImplementation(async (request) => {
        if (typeof request !== 'string' && (request as ExecuteSqlRequest).sql.trim().startsWith('SELECT')) {
          return [[lastMigration]]
        }
        return []
      })

      await applyDown(db)

      expect(db.run).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('SELECT id, description'),
        })
      )
      expect(db.updateSchema).toHaveBeenCalledWith(lastMigration.down)

      const [transaction] = await db.getTransaction()

      expect(transaction.runUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('DELETE FROM migrations'),
          params: { id: lastMigration.id },
        })
      )
    })

    it('should throw an error if no migrations are found', async () => {
      db.run.mockImplementation(async (request) => {
        if ((request as ExecuteSqlRequest).sql?.trim().startsWith('SELECT')) {
          return [[]] // No migrations found
        }
        return []
      })

      await expect(applyDown(db)).rejects.toThrow('No migrations found to roll back.')
    })

    it('should throw an error if the down script fails', async () => {
      const lastMigration: Migration = {
        id: '20250119T143000_add_users_table',
        description: 'Add users table',
        up: 'CREATE TABLE users (id STRING NOT NULL) PRIMARY KEY (id)',
        down: 'DROP TABLE users',
        appliedAt: new Date(),
      }

      db.run.mockImplementation(async (request) => {
        return [[lastMigration]]
      })

      db.updateSchema.mockImplementation(async (request) => {
        if (request === lastMigration.down) {
          throw new Error('Database error')
        }
        return []
      })

      await expect(applyDown(db)).rejects.toThrow(
        `Failed to apply down script for migration ${lastMigration.id}: Database error`
      )
    })
  })
})
