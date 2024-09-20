import type { RedisClientOptions } from 'redis'
import type { Persistor } from './persistor'
import { createPersistor } from './persistor'

export type { RedisClientOptions }

export type PromiseCacheOptions = {
  ttlInSeconds?: number
  caseSensitive?: boolean
  redis?: RedisClientOptions
  onError?: () => void
  onSuccess?: () => void
}

export const promises = {}

export class PromiseCache<U> {
  public persistor: Persistor
  private readonly caseSensitive: boolean
  private readonly ttl?: number // Time to live in milliseconds.

  /**
   * Initialize a new PromiseCache.
   * @param ttlInSeconds Default cache TTL.
   * @param caseSensitive Set to true if you want to differentiate between keys with different casing.
   */
  constructor({
    ttlInSeconds,
    caseSensitive = false,
    redis,
    onSuccess,
    onError,
  }: PromiseCacheOptions) {
    this.persistor = createPersistor({ redis, onError, onSuccess })
    this.caseSensitive = caseSensitive
    if (ttlInSeconds) {
      this.ttl = ttlInSeconds * 1000 // Convert seconds to milliseconds.
    }
  }

  /**
   * Cache size.
   * @returns The number of entries in the cache.
   */
  async size(): Promise<number> {
    return await this.persistor.size()
  }

  /**
   * Set a value in the cache.
   * @param key Cache key.
   * @param value Cache value.
   * @param ttlInSeconds Time to live in seconds.
   */
  async override<U>(
    key: string,
    value: U,
    ttlInSeconds?: number
  ): Promise<void> {
    // Normalize the key if case insensitive.
    const effectiveKey = this.caseSensitive ? key : key.toLowerCase()

    // Determine the TTL and unique cache key for this specific call.
    const effectiveTTL =
      ttlInSeconds !== undefined ? ttlInSeconds * 1000 : this.ttl

    await this.persistor.set(effectiveKey, {
      value,
      timestamp: Date.now(),
      ttl: effectiveTTL,
    })
  }

  /**
   * Get a value from the cache.
   * @param key Cache key.
   */
  async find<U>(key: string): Promise<U | null> {
    const result = await this.persistor.get<U>(key)
    return result?.value ?? null
  }

  /**
   * A simple promise cache wrapper.
   * @param key Cache key.
   * @param delegate The function to execute if the key is not in the cache.
   * @param ttlInSeconds Time to live in seconds.
   * @returns The result of the delegate function.
   */
  async wrap(
    key: string,
    delegate: () => Promise<U>,
    ttlInSeconds?: number
  ): Promise<U> {
    const now = Date.now()

    // Normalize the key if case insensitive.
    const effectiveKey = this.caseSensitive ? key : key.toLowerCase()

    // Determine the TTL and unique cache key for this specific call.
    const effectiveTTL =
      ttlInSeconds !== undefined ? ttlInSeconds * 1000 : this.ttl

    const cached = await this.persistor.get<U>(effectiveKey)

    if (cached) {
      if (cached.ttl !== effectiveTTL) {
        console.error(
          `WARNING: TTL mismatch for key: ${effectiveKey}. It is recommended to use the same TTL for the same key.`
        )
      }

      return cached.value
    }

    // Execute the delegate, cache the response with the current timestamp, and return it.
    const response = await delegate()
    this.persistor.set(effectiveKey, {
      value: response,
      timestamp: now,
      ttl: effectiveTTL,
    })

    return response
  }
}
