import type { UUID } from 'node:crypto'
import type { RedisClientOptions } from 'redis'
import { createClient } from 'redis'
import { createLocalMemoryClient } from './localMemory'

let CACHE_CLIENT = createClient
const isTestRunning = process.env.NODE_ENV === 'test'

type GetType<T> = {
  value: T
  ttl?: number
  timestamp: number
}

type SetParams<T> = {
  value: T
  timestamp: number
  ttl?: number
}

export type PersistorConstructorType = {
  redis?: RedisClientOptions
  clientId?: UUID
  onError: (error: string) => void
  onSuccess: () => void
}

export class Persistor {
  public client: ReturnType<typeof createClient> | null = null
  private clientId?: UUID
  private onError
  private onSuccess
  private readonly redis?: RedisClientOptions

  constructor({
    redis,
    clientId,
    onSuccess,
    onError,
  }: PersistorConstructorType) {
    this.onError = onError
    this.onSuccess = onSuccess
    this.clientId = clientId
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
          socket: {
            reconnectStrategy: (retries, cause) => {
              console.error(cause)
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
            console.log('reconnecting...', this.clientId)
          })
          .on('end', () => {
            console.log('end...', this.clientId)
          })

        this.client.connect()
      })
    } catch (ex) {
      this.onError(`${ex}`)
      console.error(ex)
    }
  }

  public async size(): Promise<number> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    return await this.client.DBSIZE()
  }

  public async get<T>(key: string): Promise<GetType<T> | null> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    try {
      const result = await this.client.get(key)
      if (!result) {
        return null
      }
      return JSON.parse(result) as GetType<T>
    } catch (error) {
      throw new Error(`Error getting data from redis: ${error}`)
    }
  }

  public getClientId(): UUID | undefined {
    return this.clientId
  }

  public getIsClientConnected(): boolean {
    return !!this.client?.isReady
  }

  private createOptions(ttl?: number): { EX: number } | object {
    if (ttl !== null && ttl !== undefined) {
      return { PX: Math.round(ttl) } // Return options object with Expiration time property in ms as an integer
    }
    return {} // Return empty object when ttl is null or undefined
  }

  public async set<T>(
    key: string,
    { value, timestamp, ttl }: SetParams<T>
  ): Promise<void> {
    if (!this.client || !this.client.isReady) {
      console.error('Client not ready')
      return
    }
    try {
      const serializedData = JSON.stringify({ value, ttl, timestamp })
      const options = this.createOptions(ttl)
      await this.client.set(key, serializedData, options)
    } catch (error) {
      throw new Error(`Error setting data in redis: ${error}`)
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.client || !this.client.isReady) {
      console.error('Client not ready')
      return
    }
    try {
      await this.client.del(key)
    } catch (error) {
      throw new Error(`Error deleting data from redis: ${error}`)
    }
  }
}
