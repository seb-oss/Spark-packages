export class LocalStorage {
  client = new Map()
  public isReady = false

  get(key: string) {
    return this.client.get(key)
  }

  set(key: string, value: string, options?: { PX: number }) {
    this.client.set(key, value)

    if (options?.PX) {
      setTimeout(() => {
        this.client.delete(key)
      }, options.PX)
    }
  }

  del(key: string) {
    this.client.delete(key)
  }

  clear() {
    this.client.clear()
  }

  async DBSIZE(): Promise<number> {
    return Promise.resolve(this.client.size)
  }

  // This is just for testing
  on(event: string, callback: (message: string) => void) {
    if (event === 'ready' && callback) {
      this.isReady = true
      callback('ready')
    }

    return this
  }

  connect(): Promise<this> {
    return Promise.resolve(this)
  }
}

const localStorage = new LocalStorage()

export const createLocalMemoryClient = () => {
  return localStorage
}
