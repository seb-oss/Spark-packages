import { createClient } from 'redis'
import { createLocalMemoryClient } from './localMemory'

let CACHE_CLIENT = createClient

// We use the local persistor for unit tests
if (process.env.NODE_ENV === 'test') {
  // @ts-ignore
  CACHE_CLIENT = createLocalMemoryClient
}

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

export class Persistor {
  public client: ReturnType<typeof createClient> | null = null
  status: 'connected' | 'disconnected' = 'disconnected'
  redisUrl: string | undefined

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisUrl = redisUrl
    } else {
      //@ts-ignore
      CACHE_CLIENT = createLocalMemoryClient
    }
    this.connect()
  }

  public async connect(
    onError?: (message: string) => void,
    onConnect?: (message: string) => void
  ) {
    try {
      this.client = CACHE_CLIENT({ url: this.redisUrl })

      this.client.on('error', (err) => {
        if (onError) {
          onError(`❌ REDIS | Client Error | ${this.redisUrl} ${err}`)
        }
        this.status = 'disconnected'
      })

      this.client.connect()

      await new Promise((resolve, reject) => {
        if (!this.client) {
          reject('Client not initialized')
          return
        }
        this.client.on('connect', () => {
          if (onConnect) {
            onConnect(`📦 REDIS | Connection Ready | ${this.redisUrl}`)
          }
          this.status = 'connected'
          resolve(true)
        })
      })
    } catch (err) {
      if (onError) {
        onError(`❌ REDIS | Connection Error | ${this.redisUrl} ${err}`)
      }
      this.status = 'disconnected'
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

  private createOptions(ttl?: number): { EX: number } | object {
    if (ttl !== null && ttl !== undefined) {
      return { EX: ttl / 1000 } // Return options object with Expiration time property
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

export const createPersistor = (redisUrl?: string) => {
  const persistor = new Persistor(redisUrl)
  return persistor
}
