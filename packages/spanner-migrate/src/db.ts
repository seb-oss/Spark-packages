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
    id STRING(255) NOT NULL, -- Full file name (e.g., "20250119T143000_add_users_table")
    description STRING(255) NOT NULL, -- Human-readable description (e.g., "Add Users Table")
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(), -- When the migration was applied
    up STRING(MAX), -- The up migration script
    down STRING(MAX), -- The down migration script
  PRIMARY KEY (id)
)
`

export const ensureMigrationTable = async (database: Database) => {
  // Check if table exists
  const [rows] = await database.run(SQL_SELECT_TABLE_MIGRATIONS)
  if (rows.length) return

  // Create migration table
  console.log('Creating migration table')
  await database.run(SQL_CREATE_TABLE_MIGRATIONS)
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
