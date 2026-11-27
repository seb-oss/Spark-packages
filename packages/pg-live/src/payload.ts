/** Postgres rejects payloads of 8000 bytes or more in its default configuration. */
const DEFAULT_LIMIT = 8000

/** A change as listeners see it. `keys` are rows too big to send; read them by key. */
export type Change<Row, Key> = {
  rows: Row[]
  keys: Key[]
  deleted: Key[]
}

// The wire format: short field names, empty fields left out
type Wire<T, K extends keyof T> = { r: T[]; k: T[K][]; d: T[K][] }

const serialize = <T, K extends keyof T>({ r, k, d }: Wire<T, K>) =>
  JSON.stringify({
    ...(r.length > 0 && { r }),
    ...(k.length > 0 && { k }),
    ...(d.length > 0 && { d }),
  })

const isEmpty = <T, K extends keyof T>({ r, k, d }: Wire<T, K>) =>
  r.length + k.length + d.length === 0

/**
 * Splits a change into notification payloads that each stay under `limit`
 * bytes. A row too big to fit on its own is sent as its key instead.
 */
export const encodeChanges = <T, K extends keyof T>(
  { rows, deleted }: { rows: T[]; deleted: T[K][] },
  key: K,
  limit = DEFAULT_LIMIT
): string[] => {
  const fits = (wire: Wire<T, K>) =>
    Buffer.byteLength(serialize(wire), 'utf8') < limit

  const payloads: string[] = []
  let current: Wire<T, K> = { r: [], k: [], d: [] }

  const pack = <V>(field: (wire: Wire<T, K>) => V[], value: V) => {
    field(current).push(value)
    if (fits(current)) return
    field(current).pop()
    if (!isEmpty(current)) payloads.push(serialize(current))
    current = { r: [], k: [], d: [] }
    field(current).push(value)
  }

  for (const row of rows) {
    if (fits({ r: [row], k: [], d: [] })) pack((wire) => wire.r, row)
    else pack((wire) => wire.k, row[key])
  }
  for (const id of deleted) pack((wire) => wire.d, id)

  if (!isEmpty(current)) payloads.push(serialize(current))
  return payloads
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isOptionalArray = <V>(value: unknown): value is V[] | undefined =>
  value === undefined || Array.isArray(value)

/**
 * Reads a payload written by `encodeChanges`. The rows'
 * type is declared by the caller through the live table.
 */
export const decodeChange = <Row, Key>(payload: string): Change<Row, Key> => {
  const wire: unknown = JSON.parse(payload)
  if (!isRecord(wire)) throw new Error(`Not a pg-live payload: ${payload}`)

  const { r, k, d } = wire
  if (
    !isOptionalArray<Row>(r) ||
    !isOptionalArray<Key>(k) ||
    !isOptionalArray<Key>(d)
  ) {
    throw new Error(`Not a pg-live payload: ${payload}`)
  }

  return { rows: r ?? [], keys: k ?? [], deleted: d ?? [] }
}
