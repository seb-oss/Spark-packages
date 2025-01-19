import { Spanner, type Instance, type Database } from '@google-cloud/spanner'
import { ensureMigrationTable, SQL_SELECT_TABLE_MIGRATIONS } from './db'

describe('prepare', () => {
  let spanner: jest.Mocked<Spanner>
  let instance: jest.Mocked<Instance>
  let database: jest.Mocked<Database>
  beforeEach(() => {
    spanner = new Spanner() as jest.Mocked<Spanner>
    instance = spanner.instance('my-instance') as jest.Mocked<Instance>
    database = instance.database('my-database') as jest.Mocked<Database>
  })
  describe('ensure ensureMigrationTable', () => {
    it('checks if table exists', async () => {
      await ensureMigrationTable(database)

      expect(database.run).toHaveBeenCalledWith(SQL_SELECT_TABLE_MIGRATIONS)
    })
    it('creates table if it does not exist', async () => {
      // return table row
      database.run.mockImplementation(() => [[{ table_name: 'migrations' }]])

      await ensureMigrationTable(database)

      // only select, no create
      expect(database.run).toHaveBeenCalledTimes(1)
    })
  })
})
