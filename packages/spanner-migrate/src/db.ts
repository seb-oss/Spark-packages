import type { Database } from '@google-cloud/spanner'
import type { ExecuteSqlRequest } from '@google-cloud/spanner/build/src/transaction'
import type { Migration } from './types'

export const SQL_SELECT_TABLE_MIGRATIONS = `
  SELECT
    table_name
  FROM
    information_schema.tables
  WHERE
    table_name = 'migrations'
`

export const SQL_CREATE_TABLE_MIGRATIONS = `
  CREATE TABLE migrations (
    id STRING(128) NOT NULL,
    description STRING(256) NOT NULL,
    applied_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
    up STRING(1024),
    down STRING(1024)
  ) PRIMARY KEY (id)
`

export const ensureMigrationTable = async (database: Database) => {
  // Check if table exists
  const [rows] = await database.run(SQL_SELECT_TABLE_MIGRATIONS)
  if (rows.length) return

  // Create migration table
  console.log('Creating migration table')
  try {
    await database.updateSchema(SQL_CREATE_TABLE_MIGRATIONS)
  } catch (err) {
    console.error('Failed to create migrations table')
    throw err
  }
}

export const getAppliedMigrations = async (
  db: Database
): Promise<Migration[]> => {
  try {
    // Query the database for all applied migrations, ordered by applied_at
    const req: ExecuteSqlRequest = {
      sql: `
        SELECT id, description, up, down, applied_at as appliedAt
        FROM migrations
        ORDER BY applied_at ASC
      `,
      json: true,
    }
    const [rows] = await db.run(req)

    return rows as Migration[]
  } catch (error) {
    throw new Error(
      `Failed to get applied migrations: ${(error as Error).message}`
    )
  }
}
