import type { Database } from '@google-cloud/spanner'
import type { ExecuteSqlRequest } from '@google-cloud/spanner/build/src/transaction'
import type { Migration } from './types'

export const SQL_SELECT_TABLE_MIGRATIONS = `
  SELECT
    t.TABLE_NAME,
    c.COLUMN_NAME,
    c.SPANNER_TYPE
  FROM
    information_schema.TABLES t
  INNER JOIN
  	information_schema.COLUMNS c
  ON t.TABLE_NAME = c.TABLE_NAME
  WHERE
    t.TABLE_NAME = 'migrations'
`

export const SQL_CREATE_TABLE_MIGRATIONS = `
  CREATE TABLE migrations (
    id STRING(128) NOT NULL,
    description STRING(256) NOT NULL,
    applied_at TIMESTAMP NOT NULL OPTIONS (allow_commit_timestamp = true),
    up STRING(MAX),
    down STRING(MAX)
  ) PRIMARY KEY (id)
`

export const ensureMigrationTable = async (db: Database) => {
  // Check if table exists
  const [rows] = await db.run(SQL_SELECT_TABLE_MIGRATIONS)

  if (rows.length === 0) {
    // Create migration table
    console.log('Creating migration table')
    try {
      await db.updateSchema(SQL_CREATE_TABLE_MIGRATIONS)
    } catch (err) {
      console.error('Failed to create migrations table')
      throw err
    }
  } else {
    const typedRows = rows as {
      TABLE_NAME: string
      COLUMN_NAME: string
      SPANNER_TYPE: string
    }[]
    const upType = typedRows.find((r) => r.COLUMN_NAME === 'up')
    const downType = typedRows.find((r) => r.COLUMN_NAME === 'down')
    const expectedType = 'STRING(MAX)'

    if (upType?.SPANNER_TYPE !== expectedType) {
      try {
        console.log(
          `Updating 'up' column of migration table to ${expectedType}`
        )
        await db.updateSchema(
          `ALTER TABLE migrations ALTER COLUMN up ${expectedType};`
        )
      } catch (err) {
        console.error('Failed to update migrations table')
        throw err
      }
    }

    if (downType?.SPANNER_TYPE !== expectedType) {
      try {
        console.log(
          `Updating 'down' column of migration table to ${expectedType}`
        )
        await db.updateSchema(
          `ALTER TABLE migrations ALTER COLUMN down ${expectedType};`
        )
      } catch (err) {
        console.error('Failed to update migrations table')
        throw err
      }
    }
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
