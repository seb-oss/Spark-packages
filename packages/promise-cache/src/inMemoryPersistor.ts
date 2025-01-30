import type { SetOptions } from 'redis'
import type { IPersistor } from './types'

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
    value: string,
    options?: SetOptions
  ): Promise<'OK' | null> {
    // Set the value
    this.store.set(key, value)

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
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.store.has(key)) return false
    this.setExpiration(key, seconds * 1000) // Convert seconds to ms
    return true
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
