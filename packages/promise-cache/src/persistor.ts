import { createClient } from 'redis'

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const REDIS_PORT = process.env.REDIS_PORT || 6379
const REDIS_URL = `redis://${REDIS_HOST}:${REDIS_PORT}`

type GetType<T> = {
  value: T
  ttl: number
  timestamp: number
}

type SetParams<T> = {
  value: T
  timestamp: number
  ttl: number
}

export class Persistor {
  private client: ReturnType<typeof createClient> | undefined
  status: 'connected' | 'disconnected' = 'disconnected'

  constructor() {
    this.connect()
  }

  async connect() {
    try {
      this.client = createClient({ url: REDIS_URL })

      this.client.on('error', (err) => {
        console.error(`❌ REDIS | Client Error | ${REDIS_URL}`, err)
        this.status = 'disconnected'
      })

      this.client.connect()

      await new Promise((resolve, reject) => {
        if (!this.client) {
          reject('Client not initialized')
          return
        }
        this.client.on('connect', () => {
          console.info(`📦 REDIS | Connection Ready | ${REDIS_URL}`)
          this.status = 'connected'
          resolve(true)
        })
      })
    } catch (err) {
      console.error(`❌ REDIS | Connection Error | ${REDIS_URL}`, err)
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
      console.error(`Error getting data from redis: ${error}`)
      throw error
    }
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
      await this.client.set(key, serializedData, {
        EX: ttl / 1000,
      })
    } catch (error) {
      console.error(`Error setting data in redis: ${error}`)
      throw error
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }
    try {
      await this.client.del(key)
    } catch (error) {
      console.error(`Error deleting data from redis: ${error}`)
      throw error
    }
  }
}

export const persistor = new Persistor()
