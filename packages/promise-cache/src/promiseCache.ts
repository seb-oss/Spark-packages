import { type UUID, randomUUID } from 'node:crypto'
import type { RedisClientOptions } from 'redis'
import { Persistor } from './persistor'

export type { RedisClientOptions }

export type PromiseCacheOptions = {
  ttlInSeconds?: number
  caseSensitive?: boolean
  redis?: RedisClientOptions
  onError?: (error: string) => void
  onSuccess?: () => void
}

const persistors: Record<string, Persistor> = {}

const getPersistor = ({
  redis,
  onError,
  onSuccess,
  clientId,
}: PromiseCacheOptions & { clientId: UUID }) => {
  const connectionName = redis ? redis?.name || 'default' : 'local'

  if (!persistors[connectionName]) {
    persistors[connectionName] = new Persistor({
      redis,
      onError: (error: string) => {
        onError?.(error)
        console.error(
          `❌ REDIS | Client Error | ${connectionName} | ${redis?.url}: ${error}`
        )
      },
      onSuccess: () => {
        onSuccess?.()
        console.log(
          `📦 REDIS | Connection Ready | ${connectionName} | ${redis?.url}`
        )
      },
      clientId,
    })
  }
  return persistors[connectionName]
}

export class PromiseCache<U> {
  public persistor: Persistor
  private clientId: UUID = randomUUID()
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
    this.persistor = getPersistor({
      redis,
      onError,
      onSuccess,
      clientId: this.clientId,
    })
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
