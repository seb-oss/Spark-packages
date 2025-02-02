import type { SetOptions, createClient } from 'redis'

type Client = ReturnType<typeof createClient>
type Multi = ReturnType<Client['multi']>
export type MultiExecReturnTypes =
  | Awaited<ReturnType<Multi['exec']>>[number]
  | boolean

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

/**
 * Interface for a key-value storage system that supports Redis-like commands.
 * Provides methods for storing, retrieving, and managing data with optional expiration.
 */
export interface IPersistor {
  /**
   * Stores a value in Redis or Memory with an optional expiration.
   * @param key - The storage key.
   * @param value - The string value to store.
   * @param options - Expiration options (TTL, absolute expiration, etc.).
   * @returns Resolves to `"OK"` if successful, otherwise `null` if the operation fails.
   */
  set: (
    key: string,
    value: string,
    options?: SetOptions
  ) => Promise<string | null>

  /**
   * Retrieves a value from Redis or Memory.
   * @param key - The storage key.
   * @returns Resolves to the stored value as a string, or `null` if the key does not exist.
   */
  get: (key: string) => Promise<string | null>

  /**
   * Deletes a key from Redis or Memory.
   * @param key - The storage key.
   * @returns Resolves to the number of keys removed (`1` if deleted, `0` if the key was not found).
   */
  del: (key: string) => Promise<number>

  /**
   * Sets a time-to-live (TTL) in seconds for a key.
   * @param key - The storage key.
   * @param seconds - TTL in seconds.
   * @returns Resolves to `true` if the expiration was successfully set, `false` if the key does not exist.
   */
  expire: (key: string, seconds: number) => Promise<boolean>

  /**
   * Gets the remaining TTL (time-to-live) of a key.
   * @param key - The storage key.
   * @returns
   * - The remaining TTL in seconds.
   * - `-1` if the key exists but has no expiration.
   * - `-2` if the key does not exist.
   */
  ttl: (key: string) => Promise<number>

  /**
   * Clears all keys from the storage system.
   * @returns Resolves to `"OK"` when the operation completes successfully.
   */
  flushAll: () => Promise<string>

  /**
   * Stores a value and sets an expiration time in seconds.
   * @param key - The storage key.
   * @param seconds - Expiration time in seconds.
   * @param value - The string value to store.
   * @returns Resolves to `"OK"` if successful, otherwise `null` if the operation fails.
   */
  setEx: (key: string, seconds: number, value: string) => Promise<string | null>

  /**
   * Stores a value and sets an expiration time in milliseconds.
   * @param key - The storage key.
   * @param milliseconds - Expiration time in milliseconds.
   * @param value - The string value to store.
   * @returns Resolves to `"OK"` if successful, otherwise `null` if the operation fails.
   */
  pSetEx: (
    key: string,
    milliseconds: number,
    value: string
  ) => Promise<string | null>

  /**
   * Stores a value **only if the key does not already exist**.
   * @param key - The storage key.
   * @param value - The string value to store.
   * @returns Resolves to `true` if the key was set, or `false` if the key already exists.
   */
  setNX: (key: string, value: string) => Promise<boolean>

  /**
   * Creates a multi-command batch operation.
   * This allows multiple commands to be executed in a batch, improving performance.
   * @returns An instance of `IPersistorMulti` to queue multiple commands.
   */
  multi: () => IPersistorMulti

  /**
   * Checks if keys exist in storage.
   * @param keys - One or more keys to check.
   * @returns Resolves to the number of keys that exist.
   */
  exists: (key: string | string[]) => Promise<number>

  /**
   * Increments a key by 1.
   * @param key - The key to increment.
   * @returns Resolves to the new value after increment.
   */
  incr: (key: string) => Promise<number>

  /**
   * Decrements a key by 1.
   * @param key - The key to decrement.
   * @returns Resolves to the new value after decrement.
   */
  decr: (key: string) => Promise<number>

  /**
   * Increments a key by a specified amount.
   * @param key - The key to increment.
   * @param increment - The amount to increase by.
   * @returns Resolves to the new value after increment.
   */
  incrBy: (key: string, increment: number) => Promise<number>

  /**
   * Decrements a key by a specified amount.
   * @param key - The key to decrement.
   * @param decrement - The amount to decrease by.
   * @returns Resolves to the new value after decrement.
   */
  decrBy: (key: string, decrement: number) => Promise<number>

  /**
   * Sets a field in a hash.
   * @param key - The hash key.
   * @param field - The field name.
   * @param value - The value to store.
   * @returns Resolves to `1` if the field was added, or `0` if updated.
   */
  hSet: (key: string, field: string, value: string) => Promise<number>

  /**
   * Retrieves a field from a hash.
   * @param key - The hash key.
   * @param field - The field name.
   * @returns Resolves to the value, or `undefined` if the field does not exist.
   */
  hGet: (key: string, field: string) => Promise<string | undefined>

  /**
   * Pushes values to the left (head) of a list.
   * @param key - The list key.
   * @param values - The values to add.
   * @returns Resolves to the length of the list after the operation.
   */
  lPush: (key: string, values: string | string[]) => Promise<number>

  /**
   * Pushes values to the right (tail) of a list.
   * @param key - The list key.
   * @param values - The values to add.
   * @returns Resolves to the length of the list after the operation.
   */
  rPush: (key: string, values: string | string[]) => Promise<number>

  /**
   * Removes and returns the first element from a list.
   * @param key - The list key.
   * @returns Resolves to the removed element, or `null` if the list is empty.
   */
  lPop: (key: string) => Promise<string | null>

  /**
   * Removes and returns the last element from a list.
   * @param key - The list key.
   * @returns Resolves to the removed element, or `null` if the list is empty.
   */
  rPop: (key: string) => Promise<string | null>

  /**
   * Retrieves a range of elements from a list.
   * @param key - The list key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @returns Resolves to an array of elements in the range.
   */
  lRange: (key: string, start: number, stop: number) => Promise<string[]>

  /**
   * Adds members to a set.
   * @param key - The set key.
   * @param values - The values to add.
   * @returns Resolves to the number of elements successfully added.
   */
  sAdd: (key: string, values: string | string[]) => Promise<number>

  /**
   * Removes members from a set.
   * @param key - The set key.
   * @param values - The values to remove.
   * @returns Resolves to the number of elements removed.
   */
  sRem: (key: string, values: string | string[]) => Promise<number>

  /**
   * Retrieves all members of a set.
   * @param key - The set key.
   * @returns Resolves to an array of all members in the set.
   */
  sMembers: (key: string) => Promise<string[]>

  /**
   * Adds members to a sorted set with scores.
   * @param key - The sorted set key.
   * @param members - An array of objects with `score` and `value`.
   * @returns Resolves to the number of elements successfully added.
   */
  zAdd: (
    key: string,
    members: { score: number; value: string }[]
  ) => Promise<number>

  /**
   * Retrieves a range of members from a sorted set.
   * @param key - The sorted set key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @returns Resolves to an array of member values in the range.
   */
  zRange: (key: string, start: number, stop: number) => Promise<string[]>

  /**
   * Removes members from a sorted set.
   * @param key - The sorted set key.
   * @param members - The members to remove.
   * @returns Resolves to the number of elements removed.
   */
  zRem: (key: string, members: string | string[]) => Promise<number>
}

/**
 * Interface for executing multiple storage commands in a batch operation.
 * All commands are queued and executed when `exec()` is called.
 */
export interface IPersistorMulti {
  /**
   * Stores a value in Redis or Memory with an optional expiration.
   * @param key - The storage key.
   * @param value - The string value to store.
   * @param options - Expiration options (TTL, absolute expiration, etc.).
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  set: (key: string, value: string, options?: SetOptions) => IPersistorMulti

  /**
   * Stores a value and sets an expiration time in seconds.
   * @param key - The storage key.
   * @param seconds - Expiration time in seconds.
   * @param value - The string value to store.
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  setEx: (key: string, seconds: number, value: string) => IPersistorMulti

  /**
   * Stores a value and sets an expiration time in milliseconds.
   * @param key - The storage key.
   * @param milliseconds - Expiration time in milliseconds.
   * @param value - The string value to store.
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  pSetEx: (key: string, milliseconds: number, value: string) => IPersistorMulti

  /**
   * Stores a value **only if the key does not already exist**.
   * @param key - The storage key.
   * @param value - The string value to store.
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  setNX: (key: string, value: string) => IPersistorMulti

  /**
   * Retrieves a value from Redis or Memory.
   * @param key - The storage key.
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  get: (key: string) => IPersistorMulti

  /**
   * Deletes a key from Redis or Memory.
   * @param key - The storage key.
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  del: (key: string) => IPersistorMulti

  /**
   * Sets a time-to-live (TTL) in seconds for a key.
   * @param key - The storage key.
   * @param seconds - TTL in seconds.
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  expire: (key: string, seconds: number) => IPersistorMulti

  /**
   * Gets the remaining TTL (time-to-live) of a key.
   * @param key - The storage key.
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  ttl: (key: string) => IPersistorMulti

  /**
   * Clears all keys from the storage system.
   * @returns The same `IPersistorMulti` instance, enabling method chaining.
   */
  flushAll: () => IPersistorMulti

  /**
   * Queues an `exists` operation in the transaction.
   * @param key - The storage key or an array of keys.
   * @returns The `IPersistorMulti` instance for method chaining.
   */
  exists: (key: string | string[]) => IPersistorMulti

  /**
   * Queues an `incr` operation in the transaction.
   * @param key - The storage key.
   * @returns The `IPersistorMulti` instance for method chaining.
   */
  incr: (key: string) => IPersistorMulti

  /**
   * Queues an `incrBy` operation in the transaction.
   * @param key - The storage key.
   * @param increment - The amount to increment by.
   * @returns The `IPersistorMulti` instance for method chaining.
   */
  incrBy: (key: string, increment: number) => IPersistorMulti

  /**
   * Queues a `decr` operation in the transaction.
   * @param key - The storage key.
   * @returns The `IPersistorMulti` instance for method chaining.
   */
  decr: (key: string) => IPersistorMulti

  /**
   * Queues a `decrBy` operation in the transaction.
   * @param key - The storage key.
   * @param decrement - The amount to decrement by.
   * @returns The `IPersistorMulti` instance for method chaining.
   */
  decrBy: (key: string, decrement: number) => IPersistorMulti

  /**
   * Sets a field in a hash.
   * @param key - The hash key.
   * @param field - The field name.
   * @param value - The value to store.
   * @returns The multi-instance for chaining.
   */
  hSet: (key: string, field: string, value: string) => IPersistorMulti

  /**
   * Retrieves a field from a hash.
   * @param key - The hash key.
   * @param field - The field name.
   * @returns The multi-instance for chaining.
   */
  hGet: (key: string, field: string) => IPersistorMulti

  /**
   * Pushes values to the left (head) of a list.
   * @param key - The list key.
   * @param values - The values to add.
   * @returns The multi-instance for chaining.
   */
  lPush: (key: string, values: string | string[]) => IPersistorMulti

  /**
   * Pushes values to the right (tail) of a list.
   * @param key - The list key.
   * @param values - The values to add.
   * @returns The multi-instance for chaining.
   */
  rPush: (key: string, values: string | string[]) => IPersistorMulti

  /**
   * Removes and returns the first element from a list.
   * @param key - The list key.
   * @returns The multi-instance for chaining.
   */
  lPop: (key: string) => IPersistorMulti

  /**
   * Removes and returns the last element from a list.
   * @param key - The list key.
   * @returns The multi-instance for chaining.
   */
  rPop: (key: string) => IPersistorMulti

  /**
   * Retrieves a range of elements from a list.
   * @param key - The list key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @returns The multi-instance for chaining.
   */
  lRange: (key: string, start: number, stop: number) => IPersistorMulti

  /**
   * Adds members to a set.
   * @param key - The set key.
   * @param values - The values to add.
   * @returns The multi-instance for chaining.
   */
  sAdd: (key: string, values: string | string[]) => IPersistorMulti

  /**
   * Removes members from a set.
   * @param key - The set key.
   * @param values - The values to remove.
   * @returns The multi-instance for chaining.
   */
  sRem: (key: string, values: string | string[]) => IPersistorMulti

  /**
   * Retrieves all members of a set.
   * @param key - The set key.
   * @returns The multi-instance for chaining.
   */
  sMembers: (key: string) => IPersistorMulti

  /**
   * Adds members to a sorted set with scores.
   * @param key - The sorted set key.
   * @param members - An array of objects with `score` and `value`.
   * @returns The multi-instance for chaining.
   */
  zAdd: (
    key: string,
    members: { score: number; value: string }[]
  ) => IPersistorMulti

  /**
   * Retrieves a range of members from a sorted set.
   * @param key - The sorted set key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @returns The multi-instance for chaining.
   */
  zRange: (key: string, start: number, stop: number) => IPersistorMulti

  /**
   * Removes members from a sorted set.
   * @param key - The sorted set key.
   * @param members - The members to remove.
   * @returns The multi-instance for chaining.
   */
  zRem: (key: string, members: string | string[]) => IPersistorMulti

  /**
   * Executes all queued commands and returns their results.
   * @returns A promise resolving to an array of results for each command.
   * The result type can be `string | number | boolean | null`, depending on the command.
   */
  exec: () => Promise<MultiExecReturnTypes[]>
}
