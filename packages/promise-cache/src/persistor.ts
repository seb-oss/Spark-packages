import type { UUID } from 'node:crypto'
import { type RedisClientOptions, createClient } from 'redis'

import type { Logger } from 'winston'
import { createLocalMemoryClient } from './localMemory'

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const fixESM = require('fix-esm')
import type SuperJSON from 'superjson'
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
const superjson: SuperJSON = fixESM.require('superjson')

let CACHE_CLIENT = createClient
const isTestRunning = process.env.NODE_ENV === 'test'

type GetType<T> = {
  value: T
  ttl?: number
  timestamp: number
}

type SetParams<T> = {
  value: T
  timestamp?: number
  ttl?: number
}

export type PersistorConstructorType = {
  redis?: RedisClientOptions
  clientId?: UUID
  onError?: (error: string) => void
  onSuccess?: () => void
  logger?: Logger
}

function toMillis(seconds: number) {
  return seconds * 1000
}

export class Persistor {
  public client: ReturnType<typeof createClient> | null = null
  private readonly clientId?: UUID
  private readonly onError
  private readonly onSuccess
  private readonly logger: Logger | undefined
  private readonly redis?: RedisClientOptions

  constructor({
    redis,
    clientId,
    onSuccess,
    onError,
    logger,
  }: PersistorConstructorType) {
    this.onError = onError || (() => {})
    this.onSuccess = onSuccess || (() => {})
    this.clientId = clientId
    this.logger = logger
    if (redis && !isTestRunning) {
      this.redis = redis
    } else {
      //@ts-ignore
      CACHE_CLIENT = createLocalMemoryClient
    }

    if (!this.client || !this.client.isReady) {
      this.startConnection()
    }
  }

  public async startConnection() {
    try {
      await new Promise((resolve, reject) => {
        this.client = CACHE_CLIENT({
          url: this.redis?.url,
          username: this.redis?.username,
          password: this.redis?.password,
          pingInterval: this.redis?.pingInterval || undefined,
          socket: {
            ...this.redis?.socket,
            reconnectStrategy: (retries, cause) => {
              this.logger?.error(cause)
              return 1000 * 2 ** retries
            },
          },
        })
          .on('error', (err) => {
            this.onError(err)
            reject(err)
          })
          .on('ready', () => {
            this.onSuccess()
            resolve(true)
          })
          .on('reconnecting', () => {
            this.logger?.info('reconnecting...', this.clientId)
          })
          .on('end', () => {
            this.logger?.info('end...', this.clientId)
          })

        this.client.connect()
      })
    } catch (ex) {
      this.onError(`${ex}`)
      this.logger?.error(ex)
    }
  }

  public async size(): Promise<number> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    return await this.client.DBSIZE()
  }

  public getClientId(): UUID | undefined {
    return this.clientId
  }

  public getIsClientConnected(): boolean {
    return !!this.client?.isReady
  }

  private createOptions(ttl?: number): { EX: number } | object {
    if (ttl !== null && ttl !== undefined && ttl > 0) {
      return { PX: Math.round(toMillis(ttl)) } // Return options object with Expiration time property in ms as an integer
    }
    return {} // Return empty object when ttl is null or undefined
  }

  /**
   * Set a value in the cache.
   * @param key Cache key.
   * @param object.value Value to set in the cache.
   * @param object.ttl Time to live in seconds.
   * @param object.timestamp Timestamp
   */
  public async set<T>(
    key: string,
    { value, timestamp = Date.now(), ttl }: SetParams<T>
  ): Promise<void> {
    if (!this.client || !this.client.isReady) {
      this.logger?.error('Client not ready')
      return
    }
    try {
      const serializedData = superjson.stringify({
        value,
        ttl,
        timestamp,
      })
      const options = this.createOptions(ttl)
      await this.client.set(key, serializedData, options)
    } catch (error) {
      this.logger?.error(`Error setting data in redis: ${error}`)
      throw new Error(`Error setting data in redis: ${error}`)
    }
  }

  /**
   * Get a value from the cache.
   * @param key Cache key.
   * @returns GetType<T> value
   */
  public async get<T>(key: string): Promise<GetType<T> | null> {
    if (!this.client) {
      this.logger?.error('Client not ready')
      return null
    }
    try {
      const data = await this.client.get(key)
      if (!data) {
        return null
      }

      return superjson.parse(data) as GetType<T>
    } catch (error) {
      this.logger?.error(`Error getting data in redis: ${error}`)
      throw new Error(`Error getting data from redis: ${error}`)
    }
  }

  /**
   * Delete a value from the cache.
   * @param key Cache key
   */
  public async delete(key: string): Promise<void> {
    if (!this.client || !this.client.isReady) {
      this.logger?.error('Client not ready')
      return
    }
    try {
      await this.client.del(key)
    } catch (error) {
      this.logger?.error(`Error deleting data from redis: ${error}`)
      throw new Error(`Error deleting data from redis: ${error}`)
    }
  }
}
