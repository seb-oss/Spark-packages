/** A collection kept live: every process that uses it defines it the same way. */
export type Collection<T, K extends keyof T> = {
  namespace: string
  /** Property of an entry that holds its id. */
  key: K
  channel: string
}

export type CollectionOptions<T> = {
  /** Namespace of the collection, like a table name. */
  namespace: string
  /** Property of an entry that holds its id. Its value must be a string. */
  key: keyof T & string
  /** Channel the changes are published on. Default: `<namespace>:changed`. */
  channel?: string
}

/** Defines a live collection. Declare the entry type with a type parameter. */
export const defineCollection = <T = Record<string, unknown>>({
  namespace,
  key,
  channel = `${namespace}:changed`,
}: CollectionOptions<T>): Collection<T, keyof T & string> => ({
  namespace,
  key,
  channel,
})

/** The Redis key an entry is stored under: `<namespace>:<id>`. */
export const redisKey = <T, K extends keyof T>(
  { namespace }: Collection<T, K>,
  id: T[K]
) => `${namespace}:${String(id)}`
