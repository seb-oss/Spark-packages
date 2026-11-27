# @sebspark/pg-live

Share live Postgres rows between the processes that change them and the processes that read them. Built on Postgres `LISTEN` / `NOTIFY` and [node-postgres](https://node-postgres.com).

One live table definition is used on both sides:

- **Producers** write rows and notify, in the same transaction: `writeAndNotify()`. The notification carries the changed rows themselves, so consumers rarely need to touch the database.
- **Consumers** keep all rows of a table in memory and apply each change as it arrives: `live()`. They hydrate once with one `SELECT` at startup, look rows up in O(1) by key, and get told exactly what changed.

Made for hot paths that cannot afford a database round trip per lookup. For example, a service updates user preferences through `writeAndNotify()`, while every worker that decides on incoming events whether to notify a user holds all preferences in memory with `live()`.

## The cost: memory

Every consumer process holds every row of the table in memory, so lookups take micro- rather than milliseconds. That speed is paid for in memory, once per process.

For example, 700,000 users with an id, a push token, an X-Wing public key (1,216 bytes, base64) and a locale take about 2 KB each in Node, around 1.3 GB of heap per consumer. With four consumers, that is over 5 GB.

It is worth it only where lookups must take micro- to milliseconds, faster than a round trip to the database allows. Otherwise, query the database.

## Install

```bash
npm install @sebspark/pg-live pg
```

## Define a live table

A live table is shared by the processes that write and the processes that read, so both agree on the table, the channel and the shape of a row. It holds all rows of one table: no joins, no filters.

```ts
import { defineTable } from '@sebspark/pg-live'

type UserPrefs = {
  user_id: string
  channels: string[]
  quiet_hours: { from: string; to: string } | null
}

export const userPrefs = defineTable<UserPrefs>({
  table: 'user_preferences',
  key: 'user_id', // must be a property of UserPrefs
})
```

| Option | Meaning |
| --- | --- |
| `table` | Table to keep live. May be schema-qualified, e.g. `app.user_preferences`. |
| `key` | Column that identifies a row, usually the primary key. |
| `channel` | Optional. Channel the changes are sent on. Default: `<table>_changed`. |

### Row shape

A row is the table row as JSON (`to_jsonb`), whether it arrived at startup, in a notification, or when read by key. pg-live supports simple column types and `json`/`jsonb`: text, numbers, booleans and arrays arrive as their JSON values, `json`/`jsonb` as the JSON they hold, and timestamps as ISO strings.

### Typing rows

Declare the row type with a type parameter, `defineTable<UserPrefs>(...)`, and it flows to every API that uses it: `has(key)`, `get(key)`, the events, and the keys returned to `writeAndNotify`. The rows are trusted to match, the same way a typed query result is. Without a type parameter, rows are plain JSON objects.

Keys are typed loosely: as the type of any column, not just the key column's. TypeScript cannot infer the key's own type once the row type is given explicitly, so `get(['push'])` compiles. Precise key types come from [@sebspark/drizzle-live](../drizzle-live), which derives them from the schema.

For typed rows derived from a Drizzle schema, with Drizzle's casing, see [@sebspark/drizzle-live](../drizzle-live).

## Read and stay updated

```ts
import { Pool } from 'pg'
import { createListener, live } from '@sebspark/pg-live'
import { userPrefs } from './tables'

const pool = new Pool({ connectionString })
const listener = createListener({ connectionString }) // one per process

const prefs = await live(userPrefs, { pool, listener })

prefs.has(userId)        // whether a row exists for a key
prefs.get(userId)        // current row for a key, or undefined

prefs.on('add', (row) => {})      // a row that was not in the map
prefs.on('update', (row) => {})   // a row that was in the map and changed
prefs.on('delete', (key) => {})   // a row that no longer exists

prefs.on('change', (type, payload) => {
  // every add, update and delete; payload is a row, or a key for 'delete'
  if (type === 'delete') forget(payload)
  else remember(payload)
})
```

`await live()` resolves when the table is hydrated, so `get` is ready to use from then on. The events report changes from then on; the rows loaded at startup do not emit `add`. A row that arrives identical to the one already in the map changes nothing and emits nothing.

The returned object exposes only reads and events. The rows live in a `Map` that only pg-live writes to, so a consumer cannot change its copy by mistake:

```ts
type Events<T, K extends keyof T> = { add: T; update: T; delete: T[K] }

type ChangeListener<T, K extends keyof T> = (
  ...args: { [E in keyof Events<T, K>]: [type: E, payload: Events<T, K>[E]] }[keyof Events<T, K>]
) => void

type Live<T, K extends keyof T> = Pick<Map<T[K], T>, 'has' | 'get'> & {
  on<E extends keyof Events<T, K>>(event: E, listener: (payload: Events<T, K>[E]) => void): Live<T, K>
  on(event: 'change', listener: ChangeListener<T, K>): Live<T, K>
  on(event: 'error', listener: (error: unknown) => void): Live<T, K>
  // once and off have the same signatures
  close(): Promise<void>
}
```

`on`, `once` and `off` behave like Node's `EventEmitter`, but only accept these four events and `error`, so a misspelled event name is a type error. In a `change` listener, checking `type` narrows `payload`.

### What `live()` does

1. Makes sure the shared listener runs `LISTEN` on the table's channel.
2. Only after `LISTEN` is active, reads all rows in one query and fills the map. Notifications that arrive meanwhile are held and applied after, so no change slips in between the read and the subscription.
3. On each notification:
   - rows in the payload are applied directly, without touching the database;
   - keys in the payload are read in one query (`WHERE key = ANY(...)`). A key that no longer exists is deleted;
   - deleted keys are removed from the map.
4. Emits `add`, `update` or `delete` for every row that changed, each followed by `change`.
5. On reconnect, re-runs `LISTEN` and reads all rows again, because notifications sent while disconnected are not replayed. Events are emitted for the difference between before and after.

Changes to the same key are applied in the order Postgres delivered them. A key that is being read when a new change for it arrives is handled after that read, so every key ends at its latest committed state.

### Options

| Option | Meaning |
| --- | --- |
| `pool` | `pg` Pool used for hydration and for reading rows by key. |
| `listener` | Shared listener from `createListener()`. |

### Errors

```ts
prefs.on('error', (error) => {
  logger.error(error) // e.g. the rows could not be read again after a reconnect
})
```

A lost connection is not an error: the listener reconnects on its own, and the table loads again. Errors are what pg-live cannot recover from, such as a failed read.

Once `live()` has resolved, errors happen in the background, with no caller to reject to. They are reported on the live object, like Node's `EventEmitter`: with an `error` listener, they go to it; without one, the error is thrown and ends the process. If loading fails before `live()` resolves, `live()` rejects instead.

### The shared listener

```ts
const listener = createListener({ connectionString })
```

`LISTEN` needs a long-lived session. `createListener()` opens one dedicated connection per process and serves every live table and channel over it, so the number of connections to Postgres does not grow with the number of tables. Do not point it at a pooler in transaction mode.

If the connection is lost, the listener reconnects on its own, retrying with a growing delay of up to 5 seconds, and every live table using it hydrates again.

## Write and notify

```ts
import { writeAndNotify } from '@sebspark/pg-live'
import { userPrefs } from './tables'

await writeAndNotify(pool, userPrefs, async (tx) => {
  await tx.query(
    'UPDATE user_preferences SET channels = $1 WHERE user_id = $2',
    [channels, userId]
  )
  return [userId] // keys of the rows you changed or deleted
})
```

`tx` is a `pg` client inside the transaction. The callback returns the keys of the rows it changed or deleted. Return them as the key column's values, with their JSON type: a number for an `integer` key, not a string. A key that matches no row is sent as deleted, so returning `'42'` for row `42` makes every listener drop it. pg-live's loose key typing will not catch this.

`writeAndNotify` runs the callback in a transaction. Before commit, in the same transaction, it reads the returned keys and sends:

- rows that exist, as rows;
- keys that no longer exist, as deleted.

Payloads are split into several notifications when needed to stay under the size limit. A single row too big for a notification is sent as its key, and listeners read it.

The notifications are delivered only if the transaction commits, so listeners never see a change that was rolled back.

## Building blocks

Integrations such as [@sebspark/drizzle-live](../drizzle-live) build on these pieces.

A live table is a plain object, so an integration can build one directly instead of using `defineTable`. Besides `table` and `channel`, it holds:

- `key`: the row property that identifies a row;
- `column`: the column that holds the key in the table;
- `fromDb(row)`: turns a row as Postgres sends it (`to_jsonb`, keyed by column name) into a row of the live table.

`defineTable` sets `column` to `key`, and `fromDb` to return the row as it is.

`writeAndNotify` is built from a smaller piece that notifies inside a transaction you already have open:

```ts
import { notifyChanges, type Query } from '@sebspark/pg-live'

// Runs SQL with $1, $2... parameters in the transaction you have open
const query: Query = async (text, params) => (await client.query(text, params)).rows

await notifyChanges(query, userPrefs, [userId])
```

## Schema changes

Producers and consumers deploy separately, so for a while they run against different versions of the table. pg-live always sends the row as it is in the database when it is read, not what the producer wrote, so the shape of a row follows the table's current schema.

To add a column:

1. **Add the column**, nullable or with a default. From then on every row pg-live reads or sends includes it. Old consumers receive a property they don't know about, which is harmless.
2. **Deploy consumers** that accept the column being empty.
3. **Deploy producers** that write it.

Until each row changes again, or the consumer hydrates again on reconnect or restart, a running consumer holds rows from before the column was added. Adding a column changes no rows, so nothing is notified. "Empty" therefore means two things: the property is missing on rows that have not changed, and `null` (or the default) on rows that have. Type the column as optional and nullable, e.g. `newColumn?: string | null`, and treat both the same. The first change to each such row emits `update`, because the row gained the property.

Other changes go the other way round:

- **Drop a column:** stop writing it, deploy consumers that no longer read it, then drop it.
- **Rename a column:** add the new column, copy the data, move producers and consumers over, then drop the old one. Never rename in place.
- **Change the key column:** treat it as a new live table on a new channel.

## Guarantees and limits

Consumers are eventually consistent with the database: after a transaction commits, consumers still read the old rows until its notification reaches them. This includes a consumer in the process that wrote, so a `get` straight after `await writeAndNotify()` can return the old row. Every consumer applies changes in commit order and ends on the rows the database has.

These come from Postgres `NOTIFY` behaviour:

- Notifications are delivered after the sending transaction commits, in commit order.
- Payload must be shorter than 8000 bytes in the default configuration. `pg-live` splits payloads to stay under it. A row too big for a notification is sent as its key, but a single key cannot be split: a key of 8000 bytes or more makes `writeAndNotify` fail.
- There is no replay. A listener that is not connected misses notifications. That is why `live()` hydrates again on reconnect.
- If the notification queue is full, transactions that call `NOTIFY` fail at commit.

## Graceful shutdown

```ts
process.on('SIGTERM', async () => {
  await prefs.close()    // stop applying changes to this table
  await listener.close() // UNLISTEN and release the dedicated connection
  // ... then close the HTTP server and pool
})
```

## Non-goals

- Not for joins, filters or computed columns. A live table is all rows of one table.
- Not for tables written outside pg-live. Every write must go through `writeAndNotify`, or listeners will not hear about it.
- Not a durable message queue. If delivery must not be missed, use an outbox table or a real queue.
- Not a query builder or ORM.
