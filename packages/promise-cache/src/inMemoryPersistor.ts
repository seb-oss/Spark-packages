import type { SetOptions } from 'redis'
import type {
  HashTypes,
  HashValue,
  IPersistor,
  IPersistorMulti,
  MultiExecReturnTypes,
  ZMember,
} from './types'

const sortMembers = (members: ZMember[]): ZMember[] =>
  [...members].sort((a, b) => a.score - b.score)

/**
 * An in-memory key-value store with Redis-like behavior.
 * Supports basic operations like `set`, `get`, `del`, `expire`, `ttl`, and `flushAll`.
 * Implements expiration using `setTimeout` for automatic key deletion.
 */
export class InMemoryPersistor implements IPersistor {
  /**
   * Internal key-value store for caching string values.
   * @private
   */
  private readonly store: Map<string, string>

  /**
   * Tracks active timeouts for expiring keys.
   * Each key maps to a `setTimeout` reference that deletes the key when triggered.
   * @private
   */
  private readonly expirations: Map<string, NodeJS.Timeout>

  /**
   * Stores absolute expiration timestamps (in milliseconds since epoch) for each key.
   * Used to compute remaining TTL.
   * @private
   */
  private readonly expiryTimestamps: Map<string, number>

  /**
   * Creates a new instance of `InMemoryPersistor`.
   * Initializes an empty store, expiration map, and TTL tracker.
   */
  constructor() {
    this.store = new Map()
    this.expirations = new Map()
    this.expiryTimestamps = new Map()
  }

  async connect() {
    return this
  }

  get isReady(): boolean {
    return true
  }

  get isOpen(): boolean {
    return true
  }

  once() {
    return this
  }

  /**
   * Stores a key-value pair with optional expiration settings.
   * If an expiration is provided (`EX`, `PX`, `EXAT`, `PXAT`), the key is automatically removed when TTL expires.
   *
   * @param {string} key - The key to store.
   * @param {string} value - The string value to associate with the key.
   * @param {SetOptions} [options] - Optional Redis-style expiration settings.
   * @returns {Promise<'OK' | null>} Resolves to `'OK'` on success, or `null` if a conditional set (`NX`) fails.
   */
  async set(
    key: string,
    value: HashTypes,
    options?: SetOptions
  ): Promise<'OK' | null> {
    if (options?.NX && this.store.has(key)) {
      return null // NX means "only set if key does not exist"
    }
    if (options?.XX && !this.store.has(key)) {
      return null // XX means "only set if key exists"
    }

    this.store.set(key, String(value))

    // Handle TTL (Expiration)
    if (options?.EX !== undefined) {
      this.setExpiration(key, options.EX * 1000) // Convert seconds to ms
    } else if (options?.PX !== undefined) {
      this.setExpiration(key, options.PX) // Milliseconds
    } else if (options?.EXAT !== undefined) {
      const timeToExpire = options.EXAT * 1000 - Date.now()
      this.setExpiration(key, Math.max(0, timeToExpire))
    } else if (options?.PXAT !== undefined) {
      const timeToExpire = options.PXAT - Date.now()
      this.setExpiration(key, Math.max(0, timeToExpire))
    }

    return 'OK'
  }

  /**
   * Stores a key-value pair with an expiration time in seconds.
   * If the key already exists, it will be overwritten.
   *
   * @param key - The storage key.
   * @param seconds - Expiration time in seconds.
   * @param value - The string value to store.
   * @returns Resolves to `'OK'` on success.
   */
  async setEx(
    key: string,
    seconds: number,
    value: string
  ): Promise<string | null> {
    this.store.set(key, value)
    await this.expire(key, seconds)
    return 'OK'
  }

  /**
   * Stores a key-value pair with an expiration time in milliseconds.
   * If the key already exists, it will be overwritten.
   *
   * @param key - The storage key.
   * @param milliseconds - Expiration time in milliseconds.
   * @param value - The string value to store.
   * @returns Resolves to `'OK'` on success.
   */
  async pSetEx(
    key: string,
    milliseconds: number,
    value: string
  ): Promise<string | null> {
    return this.setEx(key, milliseconds / 1000, value)
  }

  /**
   * Stores a key-value pair **only if the key does not already exist**.
   * If the key exists, the operation fails and returns `false`.
   *
   * @param key - The storage key.
   * @param value - The string value to store.
   * @returns Resolves to `true` if the key was set, or `false` if the key already exists.
   */
  async setNX(key: string, value: string): Promise<number> {
    if (this.store.has(key)) return 0
    this.store.set(key, value)
    return 1
  }

  /**
   * Retrieves the value associated with a key.
   *
   * @param {string} key - The key to retrieve.
   * @returns {Promise<string | null>} Resolves to the string value, or `null` if the key does not exist.
   */
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null
  }

  /**
   * Deletes a key from the store.
   * If the key exists, it is removed along with any associated expiration.
   *
   * @param {string} key - The key to delete.
   * @returns {Promise<number>} Resolves to `1` if the key was deleted, or `0` if the key did not exist.
   */
  async del(key: string): Promise<number> {
    const existed = this.store.has(key)
    if (existed) {
      this.store.delete(key)
      this.clearExpiration(key)
    }
    return existed ? 1 : 0
  }

  /**
   * Sets a time-to-live (TTL) in seconds for a key.
   * If the key exists, it will be deleted after the specified duration.
   *
   * @param {string} key - The key to set an expiration on.
   * @param {number} seconds - The TTL in seconds.
   * @returns {Promise<number>} Resolves to `1` if the TTL was set, or `0` if the key does not exist.
   */
  async expire(key: string, seconds: number): Promise<number> {
    if (!this.store.has(key)) return 0
    this.setExpiration(key, seconds * 1000) // Convert seconds to ms
    return 1
  }

  /**
   * Retrieves the remaining time-to-live (TTL) of a key in seconds.
   *
   * @param {string} key - The key to check.
   * @returns {Promise<number>} Resolves to:
   *   - Remaining TTL in **seconds** if the key exists and has an expiration.
   *   - `-1` if the key exists but has no expiration.
   *   - `-2` if the key does not exist.
   */
  async ttl(key: string): Promise<number> {
    if (!this.store.has(key)) return -2 // Key does not exist
    if (!this.expiryTimestamps.has(key)) return -1 // No TTL set

    const timeLeft = (this.expiryTimestamps.get(key) as number) - Date.now()
    return timeLeft > 0 ? Math.ceil(timeLeft / 1000) : -2 // Return in seconds
  }

  /**
   * Checks if one or more keys exist in the store.
   *
   * @param {string | string[]} keys - A single key or an array of keys to check.
   * @returns {Promise<number>} Resolves to the number of keys that exist.
   */
  async exists(keys: string | string[]): Promise<number> {
    const keyArray = Array.isArray(keys) ? keys : [keys]
    return keyArray.reduce(
      (count, key) => (this.store.has(key) ? count + 1 : count),
      0
    )
  }

  /**
   * Increments a numeric value stored at a key by 1.
   * If the key does not exist, it is set to `1`.
   *
   * @param {string} key - The key to increment.
   * @returns {Promise<number>} Resolves to the new value after increment.
   */
  async incr(key: string): Promise<number> {
    const current = Number(this.store.get(key)) || 0
    const newValue = current + 1
    this.store.set(key, newValue.toString())
    return newValue
  }

  /**
   * Increments a numeric value stored at a key by a specified amount.
   * If the key does not exist, it is set to the increment value.
   *
   * @param {string} key - The key to increment.
   * @param {number} increment - The amount to increase by.
   * @returns {Promise<number>} Resolves to the new value after increment.
   */
  async incrBy(key: string, increment: number): Promise<number> {
    const current = Number(this.store.get(key)) || 0
    const newValue = current + increment
    this.store.set(key, newValue.toString())
    return newValue
  }

  /**
   * Decrements a numeric value stored at a key by 1.
   * If the key does not exist, it is set to `-1`.
   *
   * @param {string} key - The key to decrement.
   * @returns {Promise<number>} Resolves to the new value after decrement.
   */
  async decr(key: string): Promise<number> {
    const current = Number(this.store.get(key)) || 0
    const newValue = current - 1
    this.store.set(key, newValue.toString())
    return newValue
  }

  /**
   * Decrements a numeric value stored at a key by a specified amount.
   * If the key does not exist, it is set to the negative decrement value.
   *
   * @param {string} key - The key to decrement.
   * @param {number} decrement - The amount to decrease by.
   * @returns {Promise<number>} Resolves to the new value after decrement.
   */
  async decrBy(key: string, decrement: number): Promise<number> {
    const current = Number(this.store.get(key)) || 0
    const newValue = current - decrement
    this.store.set(key, newValue.toString())
    return newValue
  }

  /**
   * Sets a field in a hash.
   * If the field already exists, its value is updated.
   *
   * @param key - The hash key.
   * @param field - The field name.
   * @param value - The value to store.
   * @returns Resolves to `1` if a new field was added, `0` if an existing field was updated.
   */
  async hSet(
    key: string,
    fieldOrValue: string | HashValue,
    value?: HashTypes
  ): Promise<number> {
    const existingHash = JSON.parse(this.store.get(key) ?? '{}')
    let newFields = 0
    const hashValue =
      value !== undefined
        ? { [fieldOrValue as string]: value }
        : (fieldOrValue as HashValue)

    for (const [key, val] of Object.entries(hashValue)) {
      if (!Object.hasOwn(existingHash, key)) {
        newFields++
      }
      existingHash[key] = String(val)
    }
    this.store.set(key, JSON.stringify(existingHash))
    return newFields
  }

  /**
   * Retrieves a field from a hash.
   *
   * @param key - The hash key.
   * @param field - The field name to retrieve.
   * @returns Resolves to the field value, or `null` if the field does not exist.
   */
  async hGet(key: string, field: string): Promise<string | null> {
    const hash = JSON.parse(this.store.get(key) ?? '{}')
    return hash[field] ?? null
  }

  /**
   * Retrieves a hash value.
   * @param key - The hash key.
   * @returns Resolves to the value, or null if the hash does not exist.
   */
  async hGetAll(key: string): Promise<{ [x: string]: string }> {
    return JSON.parse(this.store.get(key) ?? '{}')
  }

  /**
   * Pushes elements to the left (head) of a list.
   *
   * @param key - The list key.
   * @param values - One or more values to add.
   * @returns Resolves to the length of the list after the operation.
   */
  async lPush(key: string, values: string | string[]): Promise<number> {
    const list = JSON.parse(this.store.get(key) ?? '[]')
    const newValues = Array.isArray(values) ? values : [values]
    const updatedList = [...newValues.reverse(), ...list] // Prepend new values
    this.store.set(key, JSON.stringify(updatedList))
    return updatedList.length
  }

  /**
   * Pushes elements to the right (tail) of a list.
   *
   * @param key - The list key.
   * @param values - One or more values to add.
   * @returns Resolves to the length of the list after the operation.
   */
  async rPush(key: string, values: string | string[]): Promise<number> {
    const list = JSON.parse(this.store.get(key) ?? '[]')
    const newValues = Array.isArray(values) ? values : [values]
    const updatedList = [...list, ...newValues] // Append new values
    this.store.set(key, JSON.stringify(updatedList))
    return updatedList.length
  }

  /**
   * Removes and returns the first element from a list.
   *
   * @param key - The list key.
   * @returns Resolves to the removed element, or `null` if the list is empty.
   */
  async lPop(key: string): Promise<string | null> {
    const list = JSON.parse(this.store.get(key) ?? '[]')
    if (list.length === 0) return null
    const value = list.shift()
    if (list.length > 0) {
      this.store.set(key, JSON.stringify(list))
    } else {
      this.store.delete(key) // Remove key if empty
    }
    return value
  }

  /**
   * Removes and returns the last element from a list.
   *
   * @param key - The list key.
   * @returns Resolves to the removed element, or `null` if the list is empty.
   */
  async rPop(key: string): Promise<string | null> {
    const list = JSON.parse(this.store.get(key) ?? '[]')
    if (list.length === 0) return null
    const value = list.pop()
    if (list.length > 0) {
      this.store.set(key, JSON.stringify(list))
    } else {
      this.store.delete(key) // Remove key if empty
    }
    return value
  }

  /**
   * Retrieves a range of elements from a list.
   *
   * @param key - The list key.
   * @param start - The starting index.
   * @param stop - The stopping index.
   * @returns Resolves to an array containing the requested range.
   */
  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    const list = JSON.parse(this.store.get(key) ?? '[]')
    const normalizedStop = stop === -1 ? list.length : stop + 1
    return list.slice(start, normalizedStop) // Extract range
  }

  /**
   * Adds elements to a set.
   *
   * @param key - The set key.
   * @param values - One or more values to add.
   * @returns Resolves to the number of new elements added.
   */
  async sAdd(key: string, values: string | string[]): Promise<number> {
    const set = new Set(JSON.parse(this.store.get(key) ?? '[]'))
    const newValues = Array.isArray(values) ? values : [values]
    const initialSize = set.size
    for (const value of newValues) {
      set.add(value)
    }
    this.store.set(key, JSON.stringify([...set]))
    return set.size - initialSize
  }

  /**
   * Removes elements from a set.
   *
   * @param key - The set key.
   * @param values - One or more values to remove.
   * @returns Resolves to the number of elements removed.
   */
  async sRem(key: string, values: string | string[]): Promise<number> {
    const set = new Set(JSON.parse(this.store.get(key) ?? '[]'))
    const valuesToRemove = Array.isArray(values) ? values : [values]
    const initialSize = set.size
    for (const value of valuesToRemove) {
      set.delete(value)
    }
    this.store.set(key, JSON.stringify([...set]))
    return initialSize - set.size
  }

  /**
   * Retrieves all elements from a set.
   *
   * @param key - The set key.
   * @returns Resolves to an array of all set members.
   */
  async sMembers(key: string): Promise<string[]> {
    return JSON.parse(this.store.get(key) ?? '[]')
  }

  /**
   * Adds members to a sorted set with scores.
   * @param key - The sorted set key.
   * @param members - A member or array of members with `score` and `value`.
   * @returns Resolves to the number of elements successfully added.
   */
  async zAdd(key: string, members: ZMember | ZMember[]): Promise<number> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    const initialSize = sortedSet.length
    for (const { score, value } of Array.isArray(members)
      ? members
      : [members]) {
      const existingIndex = sortedSet.findIndex(
        (entry) => entry.value === value
      )
      if (existingIndex !== -1) {
        sortedSet[existingIndex].score = score
      } else {
        sortedSet.push({ score, value })
      }
    }
    this.store.set(key, JSON.stringify(sortMembers(sortedSet)))
    return sortedSet.length - initialSize
  }
  /**
   * Increments the score of a member in a sorted set.
   * @param key - The sorted set key.
   * @param increment - The amount to increment the score by.
   * @param member - The member to increment.
   * @returns Resolves to the new score.
   */
  async zIncrBy(
    key: string,
    increment: number,
    member: string
  ): Promise<number> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    const existingIndex = sortedSet.findIndex((entry) => entry.value === member)
    const newScore =
      existingIndex !== -1
        ? sortedSet[existingIndex].score + increment
        : increment
    const updated: ZMember = { score: newScore, value: member }
    if (existingIndex !== -1) {
      sortedSet[existingIndex] = updated
    } else {
      sortedSet.push(updated)
    }
    this.store.set(key, JSON.stringify(sortMembers(sortedSet)))
    return newScore
  }
  /**
   * Retrieves a range of members from a sorted set.
   * @param key - The sorted set key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @returns Resolves to an array of member values in the range.
   */
  async zRange(key: string, start: number, stop: number): Promise<string[]> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    const normalizedStop = stop === -1 ? sortedSet.length : stop + 1
    return sortedSet.slice(start, normalizedStop).map((entry) => entry.value)
  }
  /**
   * Retrieves a range of members with scores from a sorted set.
   * @param key - The sorted set key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @param options - Optional. Pass `{ REV: true }` to return in descending score order.
   * @returns Resolves to an array of ZMember in the range.
   */
  async zRangeWithScores(
    key: string,
    start: number,
    stop: number,
    options?: { REV: boolean }
  ): Promise<ZMember[]> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    const ordered = options?.REV ? [...sortedSet].reverse() : sortedSet
    const normalizedStop = stop === -1 ? ordered.length : stop + 1
    return ordered.slice(start, normalizedStop)
  }
  /**
   * Returns the score of a member in a sorted set.
   * @param key - The sorted set key.
   * @param member - The member to get the score for.
   * @returns Resolves to the score or null if the member does not exist.
   */
  async zScore(key: string, member: string): Promise<number | null> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    return sortedSet.find((entry) => entry.value === member)?.score ?? null
  }
  /**
   * Returns the rank of a member in a sorted set, ordered from low to high.
   * @param key - The sorted set key.
   * @param member - The member to get the rank for.
   * @returns Resolves to the rank or null if the member does not exist.
   */
  async zRank(key: string, member: string): Promise<number | null> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    const index = sortedSet.findIndex((entry) => entry.value === member)
    return index === -1 ? null : index
  }
  /**
   * Returns the number of members in a sorted set with scores between min and max.
   * @param key - The sorted set key.
   * @param min - The minimum score.
   * @param max - The maximum score.
   * @returns Resolves to the number of members in the score range.
   */
  async zCount(key: string, min: number, max: number): Promise<number> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    return sortedSet.filter((entry) => entry.score >= min && entry.score <= max)
      .length
  }
  /**
   * Returns members in a sorted set with scores between min and max.
   * @param key - The sorted set key.
   * @param min - The minimum score.
   * @param max - The maximum score.
   * @returns Resolves to an array of member values in the score range.
   */
  async zRangeByScore(
    key: string,
    min: number,
    max: number
  ): Promise<string[]> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    return sortedSet
      .filter((entry) => entry.score >= min && entry.score <= max)
      .map((entry) => entry.value)
  }
  /**
   * Returns members with scores in a sorted set with scores between min and max.
   * @param key - The sorted set key.
   * @param min - The minimum score.
   * @param max - The maximum score.
   * @returns Resolves to an array of ZMember in the score range.
   */
  async zRangeByScoreWithScores(
    key: string,
    min: number,
    max: number
  ): Promise<ZMember[]> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    return sortedSet.filter((entry) => entry.score >= min && entry.score <= max)
  }
  /**
   * Removes members from a sorted set.
   * @param key - The sorted set key.
   * @param members - The members to remove.
   * @returns Resolves to the number of elements removed.
   */
  async zRem(key: string, members: string | string[]): Promise<number> {
    const sortedSet: ZMember[] = JSON.parse(this.store.get(key) ?? '[]')
    const valuesToRemove = Array.isArray(members) ? members : [members]
    const filtered = sortedSet.filter(
      (entry) => !valuesToRemove.includes(entry.value)
    )
    this.store.set(key, JSON.stringify(filtered))
    return sortedSet.length - filtered.length
  }

  /**
   * Removes all keys from the store and clears all active expirations.
   *
   * @returns {Promise<'OK'>} Resolves to `'OK'` after all data is cleared.
   */
  async flushAll(): Promise<'OK'> {
    this.store.clear()
    for (const timeout of this.expirations.values()) {
      clearTimeout(timeout)
    }
    this.expirations.clear()
    this.expiryTimestamps.clear()
    return 'OK'
  }

  /**
   * Creates a new multi-command batch instance.
   * Commands queued in this batch will be executed together when `exec()` is called.
   *
   * @returns A new `IPersistorMulti` instance for batching commands.
   */
  multi(): IPersistorMulti {
    return new InMemoryMulti(this)
  }

  /**
   * Sets an expiration timeout for a key.
   * Cancels any existing expiration before setting a new one.
   *
   * @private
   * @param {string} key - The key to expire.
   * @param {number} ttlMs - Time-to-live in milliseconds.
   */
  private setExpiration(key: string, ttlMs: number) {
    // Clear existing timeout if any
    this.clearExpiration(key)

    // Store the absolute expiration timestamp
    const expiryTimestamp = Date.now() + ttlMs
    this.expiryTimestamps.set(key, expiryTimestamp)

    // Schedule deletion
    const timeout = setTimeout(() => {
      this.store.delete(key)
      this.expirations.delete(key)
      this.expiryTimestamps.delete(key)
    }, ttlMs)

    this.expirations.set(key, timeout)
  }

  /**
   * Cancels an active expiration timeout for a key and removes its TTL record.
   *
   * @private
   * @param {string} key - The key whose expiration should be cleared.
   */
  private clearExpiration(key: string) {
    if (this.expirations.has(key)) {
      clearTimeout(this.expirations.get(key))
      this.expirations.delete(key)
      this.expiryTimestamps.delete(key)
    }
  }
}

/**
 * Implements `IPersistorMulti` for `InMemoryPersistor`.
 */
class InMemoryMulti implements IPersistorMulti {
  private readonly persistor: IPersistor
  private readonly commands: Set<() => Promise<MultiExecReturnTypes>> =
    new Set()

  constructor(persistor: IPersistor) {
    this.persistor = persistor
  }

  /**
   * Queues a `SET` command to store a key-value pair with optional expiration settings.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The storage key.
   * @param value - The string value to store.
   * @param options - Optional expiration settings.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  set(key: string, value: string, options?: SetOptions): IPersistorMulti {
    this.commands.add(() => this.persistor.set(key, value, options))
    return this
  }

  /**
   * Queues a `SETEX` command to store a key-value pair with an expiration time in seconds.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The storage key.
   * @param seconds - Expiration time in seconds.
   * @param value - The string value to store.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  setEx(key: string, seconds: number, value: string): IPersistorMulti {
    this.commands.add(() => this.persistor.setEx(key, seconds, value))
    return this
  }

  /**
   * Queues a `PSETEX` command to store a key-value pair with an expiration time in milliseconds.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The storage key.
   * @param milliseconds - Expiration time in milliseconds.
   * @param value - The string value to store.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  pSetEx(key: string, milliseconds: number, value: string): IPersistorMulti {
    this.commands.add(() => this.persistor.pSetEx(key, milliseconds, value))
    return this
  }

  /**
   * Queues a `SETNX` command to store a key-value pair **only if the key does not already exist**.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The storage key.
   * @param value - The string value to store.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  setNX(key: string, value: string): IPersistorMulti {
    this.commands.add(() => this.persistor.setNX(key, value))
    return this
  }

  /**
   * Queues a `GET` command to retrieve the value associated with a key.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The storage key to retrieve.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  get(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.get(key))
    return this
  }

  /**
   * Queues a `DEL` command to delete a key from the store.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The storage key to delete.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  del(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.del(key))
    return this
  }

  /**
   * Queues an `EXPIRE` command to set a time-to-live (TTL) in seconds for a key.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The storage key.
   * @param seconds - TTL in seconds.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  expire(key: string, seconds: number): IPersistorMulti {
    this.commands.add(() => this.persistor.expire(key, seconds))
    return this
  }

  /**
   * Queues a `TTL` command to get the remaining time-to-live (TTL) of a key in seconds.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The storage key to check.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  ttl(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.ttl(key))
    return this
  }

  /**
   * Queues an `exists` operation in the batch.
   * @param key - The key(s) to check existence.
   * @returns The multi instance for method chaining.
   */
  exists(key: string | string[]): IPersistorMulti {
    this.commands.add(() => this.persistor.exists(key))
    return this
  }

  /**
   * Queues an `incr` operation in the batch.
   * @param key - The key to increment.
   * @returns The multi instance for method chaining.
   */
  incr(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.incr(key))
    return this
  }

  /**
   * Queues an `incrBy` operation in the batch.
   * @param key - The key to increment.
   * @param increment - The amount to increment by.
   * @returns The multi instance for method chaining.
   */
  incrBy(key: string, increment: number): IPersistorMulti {
    this.commands.add(() => this.persistor.incrBy(key, increment))
    return this
  }

  /**
   * Queues a `decr` operation in the batch.
   * @param key - The key to decrement.
   * @returns The multi instance for method chaining.
   */
  decr(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.decr(key))
    return this
  }

  /**
   * Queues a `decrBy` operation in the batch.
   * @param key - The key to decrement.
   * @param decrement - The amount to decrement by.
   * @returns The multi instance for method chaining.
   */
  decrBy(key: string, decrement: number): IPersistorMulti {
    this.commands.add(() => this.persistor.decrBy(key, decrement))
    return this
  }

  /**
   * Queues a `flushAll` operation in the batch.
   * @returns The multi instance for method chaining.
   */
  flushAll(): IPersistorMulti {
    this.commands.add(() => this.persistor.flushAll())
    return this
  }

  /**
   * Queues an `hSet` command to store a field-value pair in a hash.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The hash key.
   * @param field - The field name.
   * @param value - The value to store.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  hSet(
    key: string,
    fieldOrValue: string | HashValue,
    value?: HashTypes
  ): IPersistorMulti {
    if (value !== undefined) {
      this.commands.add(() =>
        this.persistor.hSet(key, fieldOrValue as string, value)
      )
    } else {
      this.commands.add(() =>
        this.persistor.hSet(key, fieldOrValue as HashValue)
      )
    }

    return this
  }

  /**
   * Queues an `hGet` command to retrieve a field value from a hash.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The hash key.
   * @param field - The field to retrieve.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  hGet(key: string, field: string): IPersistorMulti {
    this.commands.add(() => this.persistor.hGet(key, field))
    return this
  }

  /**
   * Queues an `hSet` command to store a field-value pair in a hash.
   * The command will be executed when `exec()` is called.
   * @param key - The hash key.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  hGetAll(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.hGetAll(key))
    return this
  }

  /**
   * Queues an `lPush` command to add elements to the left (head) of a list.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The list key.
   * @param values - The values to add.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  lPush(key: string, values: string | string[]): IPersistorMulti {
    this.commands.add(() => this.persistor.lPush(key, values))
    return this
  }

  /**
   * Queues an `rPush` command to add elements to the right (tail) of a list.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The list key.
   * @param values - The values to add.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  rPush(key: string, values: string | string[]): IPersistorMulti {
    this.commands.add(() => this.persistor.rPush(key, values))
    return this
  }

  /**
   * Queues an `lPop` command to remove and return the first element of a list.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The list key.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  lPop(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.lPop(key))
    return this
  }

  /**
   * Queues an `rPop` command to remove and return the last element of a list.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The list key.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  rPop(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.rPop(key))
    return this
  }

  /**
   * Queues an `lRange` command to retrieve a range of elements from a list.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The list key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  lRange(key: string, start: number, stop: number): IPersistorMulti {
    this.commands.add(() => this.persistor.lRange(key, start, stop))
    return this
  }

  /**
   * Queues an `sAdd` command to add elements to a set.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The set key.
   * @param values - The values to add.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  sAdd(key: string, values: string | string[]): IPersistorMulti {
    this.commands.add(() => this.persistor.sAdd(key, values))
    return this
  }

  /**
   * Queues an `sRem` command to remove elements from a set.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The set key.
   * @param values - The values to remove.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  sRem(key: string, values: string | string[]): IPersistorMulti {
    this.commands.add(() => this.persistor.sRem(key, values))
    return this
  }

  /**
   * Queues an `sMembers` command to retrieve all members of a set.
   * The command will be executed when `exec()` is called.
   *
   * @param key - The set key.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  sMembers(key: string): IPersistorMulti {
    this.commands.add(() => this.persistor.sMembers(key))
    return this
  }

  /**
   * Queues a `zAdd` command to add members to a sorted set with scores.
   * @param key - The sorted set key.
   * @param members - A member or array of members with `score` and `value`.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zAdd(key: string, members: ZMember | ZMember[]): IPersistorMulti {
    this.commands.add(() => this.persistor.zAdd(key, members))
    return this
  }
  /**
   * Queues a `zIncrBy` command to increment the score of a member in a sorted set.
   * @param key - The sorted set key.
   * @param increment - The amount to increment the score by.
   * @param member - The member to increment.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zIncrBy(key: string, increment: number, member: string): IPersistorMulti {
    this.commands.add(() => this.persistor.zIncrBy(key, increment, member))
    return this
  }
  /**
   * Queues a `zRange` command to retrieve a range of members from a sorted set.
   * @param key - The sorted set key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zRange(key: string, start: number, stop: number): IPersistorMulti {
    this.commands.add(() => this.persistor.zRange(key, start, stop))
    return this
  }
  /**
   * Queues a `zRangeWithScores` command to retrieve a range of members with scores from a sorted set.
   * @param key - The sorted set key.
   * @param start - The start index.
   * @param stop - The stop index (inclusive).
   * @param options - Optional. Pass `{ REV: true }` to return in descending score order.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zRangeWithScores(
    key: string,
    start: number,
    stop: number,
    options?: { REV: boolean }
  ): IPersistorMulti {
    this.commands.add(() =>
      this.persistor.zRangeWithScores(key, start, stop, options)
    )
    return this
  }
  /**
   * Queues a `zScore` command to get the score of a member in a sorted set.
   * @param key - The sorted set key.
   * @param member - The member to get the score for.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zScore(key: string, member: string): IPersistorMulti {
    this.commands.add(() => this.persistor.zScore(key, member))
    return this
  }
  /**
   * Queues a `zRank` command to get the rank of a member in a sorted set.
   * @param key - The sorted set key.
   * @param member - The member to get the rank for.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zRank(key: string, member: string): IPersistorMulti {
    this.commands.add(() => this.persistor.zRank(key, member))
    return this
  }
  /**
   * Queues a `zCount` command to count members in a score range.
   * @param key - The sorted set key.
   * @param min - The minimum score.
   * @param max - The maximum score.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zCount(key: string, min: number, max: number): IPersistorMulti {
    this.commands.add(() => this.persistor.zCount(key, min, max))
    return this
  }
  /**
   * Queues a `zRangeByScore` command to retrieve members within a score range.
   * @param key - The sorted set key.
   * @param min - The minimum score.
   * @param max - The maximum score.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zRangeByScore(key: string, min: number, max: number): IPersistorMulti {
    this.commands.add(() => this.persistor.zRangeByScore(key, min, max))
    return this
  }
  /**
   * Queues a `zRangeByScoreWithScores` command to retrieve members with scores within a score range.
   * @param key - The sorted set key.
   * @param min - The minimum score.
   * @param max - The maximum score.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zRangeByScoreWithScores(
    key: string,
    min: number,
    max: number
  ): IPersistorMulti {
    this.commands.add(() =>
      this.persistor.zRangeByScoreWithScores(key, min, max)
    )
    return this
  }
  /**
   * Queues a `zRem` command to remove members from a sorted set.
   * @param key - The sorted set key.
   * @param members - The members to remove.
   * @returns The `IPersistorMulti` instance to allow method chaining.
   */
  zRem(key: string, members: string | string[]): IPersistorMulti {
    this.commands.add(() => this.persistor.zRem(key, members))
    return this
  }

  /**
   * Executes multiple commands in a batch operation.
   * Each command is executed in sequence, and results are collected in an array.
   *
   * @returns Resolves to an array containing the results of each queued command.
   */
  async exec(): Promise<MultiExecReturnTypes[]> {
    return Promise.all([...this.commands].map((cmd) => cmd()))
  }
}
