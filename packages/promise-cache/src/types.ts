import type { IPersistor } from '@sebspark/memredis'

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
  wrap<A extends unknown[], R>(
    delegate: (...args: A) => R | Promise<R>,
    options: CachingOptions<A, R>
  ): (...args: A) => Promise<R>
}
