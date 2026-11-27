import {
  createListener,
  type Listener,
  type Live,
  type LiveTable,
  live as liveTable,
  notifyChanges,
  type Query,
} from '@sebspark/pg-live'
import { getTableColumns, type InferSelectModel, sql } from 'drizzle-orm'
import { toCamelCase, toSnakeCase } from 'drizzle-orm/casing'
import type {
  NodePgDatabase,
  NodePgTransaction,
} from 'drizzle-orm/node-postgres'
import {
  getTableConfig,
  type PgColumn,
  type PgTable,
} from 'drizzle-orm/pg-core'
import type { ExtractTablesWithRelations } from 'drizzle-orm/relations'
import type { Pool } from 'pg'

export { createListener, type Listener, type Live }

type Columns<TTable extends PgTable> = TTable['_']['columns']

type PrimaryKey<TTable extends PgTable> = {
  [P in keyof Columns<TTable>]: Columns<TTable>[P]['_']['isPrimaryKey'] extends true
    ? P
    : never
}[keyof Columns<TTable>]

type PropertyOf<TTable extends PgTable, C extends PgColumn> = {
  [P in keyof Columns<TTable>]: Columns<TTable>[P] extends C ? P : never
}[keyof Columns<TTable>]

/** The row property that identifies a row: the given column's, or the primary key's. */
type KeyOf<TTable extends PgTable, C extends PgColumn> = ([C] extends [never]
  ? PrimaryKey<TTable>
  : PropertyOf<TTable, C>) &
  keyof InferSelectModel<TTable>

export type Casing = 'snake_case' | 'camelCase'

export type LiveTableOptions<C extends PgColumn> = {
  /** Column that identifies a row. Default: the table's primary key. */
  key?: C
  /** The same `casing` you pass to `drizzle()`. */
  casing?: Casing
  /** Channel the changes are sent on. Default: `<table>_changed`. */
  channel?: string
}

/** A live table typed from a Drizzle table. */
export type DrizzleLiveTable<
  TTable extends PgTable,
  C extends PgColumn = never,
> = LiveTable<InferSelectModel<TTable>, KeyOf<TTable, C>>

/** Defines a live table from a Drizzle table, with its column names and casing. */
export const defineLiveTable = <
  TTable extends PgTable,
  C extends PgColumn = never,
>(
  table: TTable,
  { key, casing, channel }: LiveTableOptions<C> = {}
): DrizzleLiveTable<TTable, C> => {
  const columns = Object.entries(getTableColumns(table))
  const { name, schema } = getTableConfig(table)
  const tableName = schema ? `${schema}.${name}` : name

  // Columns without an explicit name only get their database name from the casing
  const dbName = (column: PgColumn) => {
    if (!column.keyAsName || !casing) return column.name
    return casing === 'snake_case'
      ? toSnakeCase(column.name)
      : toCamelCase(column.name)
  }

  const keyColumn = columns.find(([, column]) =>
    key ? column === key : column.primary
  )
  if (!keyColumn) {
    throw new Error(`${tableName} has no primary key; pass the key column`)
  }

  return {
    table: tableName,
    channel: channel ?? `${tableName}_changed`,
    // biome-ignore lint/plugin/no-type-assertion: the property found at runtime is the one KeyOf computes from the same table
    key: keyColumn[0] as KeyOf<TTable, C>,
    column: dbName(keyColumn[1]),
    fromDb: (row) =>
      // biome-ignore lint/plugin/no-type-assertion: each column's own Drizzle mapping produces its select type
      Object.fromEntries(
        columns.map(([property, column]) => {
          const value = row[dbName(column)]
          return [
            property,
            value === null || value === undefined
              ? value
              : column.mapFromDriverValue(value),
          ]
        })
      ) as InferSelectModel<TTable>,
  }
}

export type LiveOptions = {
  /** Shared listener from `createListener()`. */
  listener: Listener
}

/**
 * Keeps all rows of `table` in memory, typed like the Drizzle table, and
 * applies every change as it arrives. Resolves when the rows are loaded.
 */
export const live = <T, K extends keyof T>(
  db: { $client: Pool },
  table: LiveTable<T, K>,
  { listener }: LiveOptions
): Promise<Live<T, K>> => liveTable(table, { pool: db.$client, listener })

// Turns SQL with $1, $2... placeholders into Drizzle SQL with the same parameters
const toDrizzleSql = (text: string, params: unknown[]) =>
  sql.join(
    text
      .split(/\$(\d+)/)
      .map((part, index) =>
        index % 2 === 0 ? sql.raw(part) : sql.param(params[Number(part) - 1])
      )
  )

/**
 * Runs `write` in a Drizzle transaction and notifies listeners of the keys it
 * returns. The notifications are delivered only if the transaction commits.
 */
export const writeAndNotify = <
  TSchema extends Record<string, unknown>,
  T,
  K extends keyof T,
>(
  db: NodePgDatabase<TSchema>,
  table: LiveTable<T, K>,
  write: (
    tx: NodePgTransaction<TSchema, ExtractTablesWithRelations<TSchema>>
  ) => Promise<T[K][]>
) =>
  db.transaction(async (tx) => {
    const query: Query = async (text, params) =>
      (await tx.execute(toDrizzleSql(text, params))).rows
    await notifyChanges(query, table, await write(tx))
  })
