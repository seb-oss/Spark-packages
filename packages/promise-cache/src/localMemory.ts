export class LocalStorage {
  client = new Map()

  get(key: string) {
    return this.client.get(key)
  }

  set(key: string, value: string, options?: { EX: number }) {
    this.client.set(key, value)

    if (options?.EX) {
      setTimeout(() => {
        this.client.delete(key)
      }, options.EX / 1000)
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
    if (event === 'connect') {
      callback('connect')
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
