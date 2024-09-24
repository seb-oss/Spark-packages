import { type UUID, randomUUID } from 'node:crypto'
import { retry } from '@sebspark/retry'
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

type PersistorConstructorType = {
  redis?: RedisClientOptions
  onError?: (c: string) => void
  onSuccess?: (c: string) => void
}

export class Persistor {
  public client: ReturnType<typeof createClient> | null = null
  private clientId: UUID = randomUUID()
  private onError
  private onSuccess
  private isConnected = false
  private readonly redis?: RedisClientOptions

  constructor(options: PersistorConstructorType) {
    const { redis, onError, onSuccess } = options
    this.onError = onError
    this.onSuccess = onSuccess
    if (redis && !isTestRunning) {
      this.redis = redis
    } else {
      //@ts-ignore
      CACHE_CLIENT = createLocalMemoryClient
    }
    if (!this.isConnected) {
      this.connect()
    }
  }

  public async connect() {
    const settings = {
      interval: (x: number) => {
        return x * 2 * 1000
      },
      maxRetries: 5,
      retryCondition: () => {
        console.log(`Trying to connect: ${this.clientId}, ${this.redis?.name}`)
        return true
      },
    }
    await retry(() => this.startConnection(), settings)
  }

  public async startConnection(): Promise<unknown> {
    try {
      this.client = CACHE_CLIENT(this.redis)

      this.client.on('error', (err) => {
        this.isConnected = false

        if (this.onError) {
          this.onError(`❌ REDIS | Client Error | ${this.redis?.url} ${err}`)
        }
        throw new Error(`❌ REDIS | Client Error | ${this.redis?.url} ${err}`)
      })

      this.client.on('connect', () => {
        this.isConnected = true

        if (this.onSuccess) {
          this.onSuccess(
            `📦 REDIS | Connection Ready | ${this.redis?.name} | ${this.clientId} | ${this.redis?.url}`
          )
        }
        console.log(
          `📦 REDIS | Connection Ready | ${this.redis?.name} | ${this.clientId} | ${this.redis?.url}`
        )
      })

      return await this.client.connect()
    } catch (err) {
      if (this.onError) {
        this.onError(`❌ REDIS | Connection Error | ${this.redis?.url} ${err}`)
      }
      throw new Error(`❌ REDIS | Connection Error | ${this.redis?.url} ${err}`)
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

  public getClientId(): UUID {
    return this.clientId
  }

  public getIsClientConnected(): boolean {
    return this.isConnected
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
    if (!this.client) {
      throw new Error('Client not initialized')
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
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    try {
      await this.client.del(key)
    } catch (error) {
      throw new Error(`Error deleting data from redis: ${error}`)
    }
  }
}

const persistors: Record<string, Persistor> = {}

export const createPersistor = ({
  redis,
  onError,
  onSuccess,
}: {
  redis?: RedisClientOptions
  onError?: () => void
  onSuccess?: () => void
}) => {
  if (redis) {
    let connectionName = redis.url
    if (redis.name) {
      connectionName = redis.name
    }
    const key = connectionName as keyof typeof persistors
    if (!persistors[key]) {
      persistors[key] = new Persistor({
        redis,
        onError,
        onSuccess,
      })
    }

    return persistors[key]
  }
  return new Persistor({
    onSuccess,
    onError,
  })
}
