import type { Pool } from 'pg'
import type { Listener } from './listener'
import { decodeChange } from './payload'
import { createStore } from './store'
import { type DbRow, type LiveTable, selectRows } from './table'
import type { Live } from './types'

export type LiveOptions = {
  /** Pool used for hydration and for reading rows by key. */
  pool: Pool
  /** Shared listener from `createListener()`. */
  listener: Listener
}

/**
 * Keeps all rows of `table` in memory and applies every change as it arrives.
 * Resolves when the rows are loaded; errors after that are emitted as `error`.
 */
export const live = async <T, K extends keyof T>(
  table: LiveTable<T, K>,
  { pool, listener }: LiveOptions
): Promise<Live<T, K>> => {
  const read = async (keys?: T[K][]) => {
    const { rows } = await pool.query<{ row: DbRow }>(
      selectRows(table, keys !== undefined),
      keys === undefined ? [] : [keys]
    )
    return rows.map(({ row }) => table.fromDb(row))
  }

  let unlisten = async () => {}
  const store = createStore<T, K>(table.key, () => unlisten())

  // On a later tick, so a thrown error (no `error` listener) cannot stop the
  // queue below or the listener's reconnects
  const report = (error: unknown) => {
    setImmediate(() => store.fail(error))
  }

  const hydrate = async () => store.replaceAll(await read())

  const apply = async (payload: string) => {
    const { rows, keys, deleted } = decodeChange<DbRow, T[K]>(payload)
    for (const row of rows) store.upsert(table.fromDb(row))
    for (const key of deleted) store.remove(key)
    if (keys.length === 0) return

    const found = await read(keys)
    for (const row of found) store.upsert(row)
    const existing = new Set(found.map((row) => row[table.key]))
    for (const key of keys) if (!existing.has(key)) store.remove(key)
  }

  // Changes are applied one at a time, in the order they arrived
  let queue: Promise<void> = Promise.resolve()
  const enqueue = (task: () => Promise<void>) => {
    queue = queue.then(task).catch(report)
  }

  // Listen before reading, so no change slips in between
  const listening = listener.listen(table.channel, {
    onNotify: (payload) => enqueue(() => apply(payload)),
    onReconnect: () => enqueue(hydrate),
  })
  const loaded = listening.then(async (stop) => {
    unlisten = stop
    await hydrate()
  })
  queue = loaded.catch(() => {})

  await loaded.catch(async (error) => {
    // Stop listening for a table that never loaded, then report why
    await store.live.close()
    throw error
  })
  return store.live
}
