# @sebspark/drizzle-live

[@sebspark/pg-live](../pg-live) for [Drizzle](https://orm.drizzle.team): share live rows between the processes that change them and the processes that read them, typed from your Drizzle schema.

- **Producers** write with Drizzle and notify in the same transaction: `writeAndNotify()`.
- **Consumers** keep all rows of a table in memory, typed as `typeof table.$inferSelect`, and apply each change as it arrives: `live()`.

Everything pg-live guarantees applies here; drizzle-live adds the Drizzle types, column names and casing on top. For how changes are delivered, eventual consistency, reconnects, limits, schema changes and shutdown, read the [pg-live README](../pg-live); this one covers only what differs.

## The cost: memory

Every consumer process holds every row of the table in memory, so lookups take micro- rather than milliseconds, and pays for it in memory, once per process: 700,000 users with a push token and an X-Wing public key take around 1.3 GB per consumer ([the example in pg-live](../pg-live#the-cost-memory)). It is worth it only where lookups must take micro- to milliseconds, faster than a round trip to the database allows. Otherwise, query with Drizzle.

## Install

```bash
npm install @sebspark/drizzle-live drizzle-orm pg
```

Works with the node-postgres driver (`drizzle-orm/node-postgres`).

## Define a live table

Start from the Drizzle table you already have:

```ts
import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { defineLiveTable } from '@sebspark/drizzle-live'

export const userPreferences = pgTable('user_preferences', {
  userId: text().primaryKey(),
  channels: text().array().notNull(),
  quietHours: jsonb().$type<{ from: string; to: string }>(),
  updatedAt: timestamp({ withTimezone: true }).notNull(),
})

export const userPrefs = defineLiveTable(userPreferences, {
  casing: 'snake_case', // the same casing you pass to drizzle()
})
```

| Option | Meaning |
| --- | --- |
| `key` | Optional. Column that identifies a row, e.g. `userPreferences.userId`. Default: the table's single-column primary key; tables with a composite primary key must pass one. Either way the key is typed precisely, as that column's type. |
| `casing` | Optional. `'snake_case'` or `'camelCase'`, the same as the `casing` option of `drizzle()`. Must match it, because columns without an explicit name only get their database name from it. |
| `channel` | Optional. Channel the changes are sent on. Default: `<table>_changed`. |

## Read and stay updated

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { createListener, live } from '@sebspark/drizzle-live'
import { userPrefs } from './schema'

const db = drizzle({ connection: connectionString, casing: 'snake_case' })
const listener = createListener({ connectionString }) // one per process

const prefs = await live(db, userPrefs, { listener })

prefs.has(userId)
const p = prefs.get(userId) // typeof userPreferences.$inferSelect | undefined
p?.quietHours               // camelCase keys, as in your schema
p?.updatedAt                // a Date, as Drizzle returns it

prefs.on('update', (row) => {})  // row typed like the table
prefs.on('delete', (key) => {})  // key typed like the key column
```

`live()` returns the same read-only `Live` object as pg-live (`has`, `get`, `on`/`once`/`off` for `add`, `update`, `delete`, `change` and `error`, `close`), typed from the Drizzle table. Background errors are reported on its `error` event; see [Errors in pg-live](../pg-live#errors). The key is typed as the key column's type, so `prefs.get(42)` on a text key is a type error.

| Option | Meaning |
| --- | --- |
| `listener` | Shared listener from `createListener()`. |

`live()` reads through `db.$client`, the `pg` pool behind your Drizzle client.

Rows look like the rows a Drizzle `select()` returns: property names are your schema's keys, and every value goes through its column's Drizzle mapping, so timestamps arrive as `Date`. This holds whether a row came from hydration, from a notification payload, or from a read by key. Like pg-live, drizzle-live supports simple column types and `json`/`jsonb`.

`createListener` is re-exported from pg-live; one listener per process serves every live table.

## Write and notify

```ts
import { eq } from 'drizzle-orm'
import { writeAndNotify } from '@sebspark/drizzle-live'
import { userPreferences, userPrefs } from './schema'

await writeAndNotify(db, userPrefs, async (tx) => {
  await tx
    .update(userPreferences)
    .set({ channels, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
  return [userId] // keys of the rows you changed or deleted
})
```

`tx` is an ordinary Drizzle transaction. Before it commits, drizzle-live reads the returned keys in the same transaction and notifies with pg-live's `notifyChanges`, so listeners get the committed rows, or the keys as deleted, and nothing if the transaction rolls back.

The callback must return keys of the key column's type; returning `'42'` for an `integer` key is a type error.

### Which columns can be the key

Keys are compared as Postgres sends them, before Drizzle's mapping. Use a key column whose value is the same in both: `text`, `uuid`, `integer`, `serial` and the like. A `bigint` in `bigint` mode, or a timestamp, does not work as a key.

## Schema changes

Follow the order in the [pg-live README](../pg-live#schema-changes). One difference: drizzle-live builds rows from your Drizzle schema, not from whatever columns the table has.

- A column in the table but not yet in your schema is left out of the rows.
- A column in your schema that a row does not have yet (rows loaded before the column was added) is `undefined` on that row. Treat `undefined` and `null` the same until every consumer has hydrated again.

## Graceful shutdown

```ts
process.on('SIGTERM', async () => {
  await prefs.close()    // stop applying changes to this table
  await listener.close() // UNLISTEN and release the dedicated connection
  // ... then close the HTTP server and the Drizzle client's pool
})
```

## How it maps onto pg-live

- The live table becomes a pg-live table with the database names of the table, key and columns.
- Rows arrive from pg-live in its JSON row shape, keyed by database column names. drizzle-live renames them to your schema's keys and converts each value with the column's Drizzle mapping.
- `writeAndNotify` uses pg-live's `notifyChanges` inside the Drizzle transaction.

## Non-goals

- Not for joins, filters or relational queries. A live table is all rows of one table.
- Not for tables written outside drizzle-live. Every write must go through `writeAndNotify`, or listeners will not hear about it.
- Only the node-postgres driver, because `LISTEN` needs pg's long-lived connection.
