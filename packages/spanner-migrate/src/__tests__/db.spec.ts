import { type Database, type Instance, Spanner } from '@google-cloud/spanner'
import {
  SQL_CREATE_TABLE_MIGRATIONS,
  SQL_SELECT_TABLE_MIGRATIONS,
  ensureMigrationTable,
  getAppliedMigrations,
} from '../db'

describe('prepare', () => {
  let spanner: jest.Mocked<Spanner>
  let instance: jest.Mocked<Instance>
  let database: jest.Mocked<Database>
  beforeEach(() => {
    spanner = new Spanner() as jest.Mocked<Spanner>
    instance = spanner.instance('my-instance') as jest.Mocked<Instance>
    database = instance.database('my-database') as jest.Mocked<Database>
  })
  afterEach(() => {
    spanner.close()
  })
  describe('ensure ensureMigrationTable', () => {
    it('checks if table exists', async () => {
      await ensureMigrationTable(database)

      expect(database.run).toHaveBeenCalledWith(SQL_SELECT_TABLE_MIGRATIONS)
    })
    it('creates table if it does not exist', async () => {
      // return table row
      database.run.mockImplementation(() => [[]])

      await ensureMigrationTable(database)

      // only select, no create
      expect(database.updateSchema).toHaveBeenCalledTimes(1)
      expect(database.updateSchema).toHaveBeenCalledWith(
        SQL_CREATE_TABLE_MIGRATIONS
      )
    })
    it('creates does not create table if it does exist', async () => {
      // return table row
      database.run.mockImplementation(() => [[{ table_name: 'migrations' }]])

      await ensureMigrationTable(database)

      // only select, no create
      expect(database.updateSchema).toHaveBeenCalledTimes(0)
    })
  })
  describe('getAppliedMigrations', () => {
    it('retrieves applied migrations', async () => {
      // Mock database query
      const mockMigrations = [
        {
          id: '20250119T143000_add_users_table',
          description: 'Add Users Table',
          up: 'CREATE TABLE users (id STRING(36))',
          down: 'DROP TABLE users',
          appliedAt: '2025-01-19T14:30:00Z',
        },
      ]
      database.run.mockImplementation(async () => [mockMigrations])

      const migrations = await getAppliedMigrations(database)

      expect(database.run).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining(
            'SELECT id, description, up, down, applied_at as appliedAt'
          ),
        })
      )
      expect(migrations).toEqual(mockMigrations)
    })

    it('throws an error if the query fails', async () => {
      // Mock an error during query
      database.run.mockImplementation(async () => {
        throw new Error('Query failed')
      })

      await expect(getAppliedMigrations(database)).rejects.toThrow(
        'Failed to get applied migrations: Query failed'
      )
    })
  })
})
