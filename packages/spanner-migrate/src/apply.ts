import type { Database } from '@google-cloud/spanner'
import type { ExecuteSqlRequest, Migration } from './types.js'

export const applyUp = async (db: Database, migration: Migration) => {
  try {
    // Apply the up migration
    await runScript(db, migration.up)
    console.log(
      `Successfully applied migration script for: ${migration.description}`
    )

    // Record in the `migrations` table
    const req: ExecuteSqlRequest = {
      sql: `
          INSERT INTO migrations (id, description, applied_at, up, down)
          VALUES (@id, @description, CURRENT_TIMESTAMP(), @up, @down)
        `,
      params: migration,
      json: true,
    }

    await db.runTransactionAsync(async (transaction) => {
      await transaction.runUpdate(req)
      await transaction.commit()
    })
    console.log(`Migration recorded in the database: ${migration.id}`)
  } catch (error) {
    throw new Error(
      `Failed to apply migration ${migration.id}: ${(error as Error).message}`
    )
  }
}

export const applyDown = async (db: Database) => {
  // Step 1: Get the last applied migration
  const req: ExecuteSqlRequest = {
    sql: `
      SELECT id, description, up, down
      FROM migrations
      ORDER BY applied_at DESC
      LIMIT 1
    `,
    json: true,
  }
  const [rows] = await db.run(req)
  const lastMigration = rows?.[0] as Migration

  if (!lastMigration) {
    throw new Error('No migrations found to roll back.')
  }

  // Step 2: Apply the down script
  try {
    await runScript(db, lastMigration.down)
  } catch (error) {
    throw new Error(
      `Failed to apply down script for migration ${lastMigration.id}: ${(error as Error).message}`
    )
  }

  // Step 3: Remove the migration record
  await db.runTransactionAsync(async (transaction) => {
    await transaction.runUpdate({
      sql: `
      DELETE FROM migrations
      WHERE id = @id
      `,
      params: { id: lastMigration.id },
    })
    await transaction.commit()
  })

  console.log(
    `Successfully rolled back migration: ${lastMigration.description}`
  )
}

const runScript = async (db: Database, script: string): Promise<void> => {
  // Split the script into individual statements by ``
  const statements = script
    .split(';') // Split by `;`
    .filter(Boolean) // Remove empty statements
    .map((stmt) => stmt.trim()) // Remove leading/trailing whitespace
    .filter(Boolean) // Remove empty statements

  if (statements.length === 0) {
    throw new Error('No valid SQL statements found in the script.')
  }

  // Loop over statements (since schema changes cannot be run in a transaction)
  for (const statement of statements) {
    console.log(`Executing statement: ${statement}`)

    if (isSchemaChange(statement)) {
      await db.updateSchema(statement)
    } else {
      await db.runTransactionAsync(async (transaction) => {
        await transaction.runUpdate(statement)
        await transaction.commit()
      })
    }
  }
}

const isSchemaChange = (sql: string) =>
  /^\s*(CREATE|ALTER|DROP|TRUNCATE)\b/i.test(sql)
