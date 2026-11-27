import type { Pool, PoolClient } from 'pg'
import { encodeChanges } from './payload'
import { type DbRow, isDbRow, type LiveTable, selectRows } from './table'

/** Runs SQL with `$1`, `$2`... parameters in an open transaction and returns its rows. */
export type Query = (
  text: string,
  params: unknown[]
) => Promise<Record<string, unknown>[]>

/**
 * Notifies listeners of the rows with `keys`, inside a transaction you already
 * have open: rows that exist are sent as rows, the others as deleted.
 */
export const notifyChanges = async <T, K extends keyof T>(
  query: Query,
  table: LiveTable<T, K>,
  keys: T[K][]
) => {
  if (keys.length === 0) return

  const found = await query(selectRows(table, true), [keys])
  const rows = found.map(({ row }) => row).filter(isDbRow)
  const existing = new Set(rows.map((row) => row[table.column]))
  const deleted = keys.filter((key) => !existing.has(key))

  for (const payload of encodeChanges<DbRow, string>(
    { rows, deleted },
    table.column
  )) {
    await query('SELECT pg_notify($1, $2)', [table.channel, payload])
  }
}

/**
 * Runs `write` in a transaction and notifies listeners of the keys it returns.
 * The notifications are delivered only if the transaction commits.
 */
export const writeAndNotify = async <T, K extends keyof T>(
  pool: Pool,
  table: LiveTable<T, K>,
  write: (tx: PoolClient) => Promise<T[K][]>
) => {
  const client = await pool.connect()
  const query: Query = async (text, params) =>
    (await client.query(text, params)).rows

  // A lost connection also surfaces as an error from the query in flight;
  // without a listener, pg's client error event would end the process
  const ignoreConnectionError = () => {}
  client.on('error', ignoreConnectionError)
  let broken = false

  try {
    await client.query('BEGIN')
    await notifyChanges(query, table, await write(client))
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {
      broken = true
    })
    throw error
  } finally {
    client.off('error', ignoreConnectionError)
    // A broken client is destroyed rather than returned to the pool
    client.release(broken)
  }
}
