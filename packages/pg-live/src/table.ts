/** A table row as Postgres sends it: `to_jsonb(row)`, keyed by column name. */
export type DbRow = Record<string, unknown>

export const isDbRow = (value: unknown): value is DbRow =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A table kept live: shared by the processes that write and those that read. */
export type LiveTable<T, K extends keyof T> = {
  table: string
  channel: string
  /** Property of a row that identifies it. */
  key: K
  /** Column in the table that holds the key. */
  column: string
  /** Turns a row as Postgres sends it into a row of the live table. */
  fromDb: (row: DbRow) => T
}

export type TableOptions<T> = {
  /** Table to keep live. May be schema-qualified, e.g. `app.user_preferences`. */
  table: string
  /** Column that identifies a row, usually the primary key. */
  key: keyof T & string
  /** Channel the changes are sent on. Default: `<table>_changed`. */
  channel?: string
}

/** Defines a live table. Declare the row type with a type parameter. */
export const defineTable = <T = DbRow>({
  table,
  key,
  channel = `${table}_changed`,
}: TableOptions<T>): LiveTable<T, keyof T & string> => ({
  table,
  channel,
  key,
  column: key,
  // biome-ignore lint/plugin/no-type-assertion: the caller declares the row type through the type parameter
  fromDb: (row) => row as T,
})

/** Quotes an identifier, keeping a schema prefix: `app.t` becomes `"app"."t"`. */
export const quoteIdent = (name: string) =>
  name
    .split('.')
    .map((part) => `"${part.replaceAll('"', '""')}"`)
    .join('.')

/** Selects rows of a live table as Postgres sends them, one `row` column per row. */
export const selectRows = <T, K extends keyof T>(
  { table, column }: LiveTable<T, K>,
  byKey = false
) =>
  `SELECT to_jsonb(t) AS row FROM ${quoteIdent(table)} t` +
  (byKey ? ` WHERE t.${quoteIdent(column)} = ANY($1)` : '')
