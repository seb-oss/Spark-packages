import type { SetOptions } from 'redis'

/**
 * Defines the expiration strategy for cached values.
 *
 * - A `number` is interpreted as a TTL (time-to-live) in **milliseconds**.
 * - A `Date` represents an **exact expiration timestamp**.
 * - If omitted, the cache entry **never expires**.
 */
export type Expiry = number | Date

/**
 * Options for caching a function's result.
 * @template A - Argument types of the function.
 */
export type CachingOptions<A extends unknown[], R> = {
  /**
   * A fixed key or a function that generates a key based on function arguments.
   */
  key: string | ((...args: A) => string)

  /**
   * Defines how long the cached value remains valid before expiring.
   *
   * - A **number** is treated as a TTL (time-to-live) in **milliseconds**.
   * - A **Date** sets an **exact expiration timestamp**.
   * - A **function** dynamically determines the expiration based on:
   *   - `args` - The function arguments.
   *   - `response` - The function result.
   * - If omitted, the cache entry **does not expire**.
   */
  expiry?: Expiry | ((args: A, response: R) => Expiry)
}

/**
 * Represents a caching system that wraps asynchronous functions.
 */
export type Cache = {
  /**
   * The underlying persistor used for caching.
   */
  persistor: IPersistor

  /**
   * Wraps an asynchronous function to enable caching.
   * @template A - Argument types.
   * @template R - Return type.
   * @param {Delegate<A, R>} delegate - The function to wrap.
   * @param {CachingOptions<A>} options - Caching options, including key strategy.
   * @returns {Delegate<A, R>} A new function that caches results.
   */
  wrap: <A extends unknown[], R>(
    delegate: (...args: A) => Promise<R>,
    options: CachingOptions<A, R>
  ) => (...args: A) => Promise<R>
}

export interface IPersistor {
  /**
   * Stores a value in Redis or Memory with an optional expiration.
   * @param key - The storage key.
   * @param value - The string value to store.
   * @param options - Expiration options.
   * @returns Resolves to `"OK"` if successful.
   */
  set: (
    key: string,
    value: string,
    options?: SetOptions
  ) => Promise<string | null>

  /**
   * Retrieves a value from Redis or Memory.
   * @param key - The storage key.
   * @returns Resolves to the stored value or `null` if not found.
   */
  get: (key: string) => Promise<string | null>

  /**
   * Deletes a key from Redis or Memory.
   * @param key - The storage key.
   * @returns Resolves to the number of keys removed (1 if deleted, 0 if not found).
   */
  del: (key: string) => Promise<number>

  /**
   * Sets a time-to-live (TTL) in seconds for a key.
   * @param key - The storage key.
   * @param seconds - TTL in seconds.
   * @returns Resolves to true if successful, false if key does not exist.
   */
  expire: (key: string, seconds: number) => Promise<boolean>

  /**
   * Gets the remaining TTL of a key in seconds.
   * @param key - The storage key.
   * @returns Remaining TTL in seconds, `-1` if no TTL is set, or `-2` if key does not exist.
   */
  ttl: (key: string) => Promise<number>

  /**
   * Clears all keys in Redis or Memory.
   * @returns Resolves to `"OK"` when complete.
   */
  flushAll: () => Promise<string>
}
