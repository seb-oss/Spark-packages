class MockedRedis {
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

  clear() {
    this.client.clear()
  }

  async DBSIZE(): Promise<number> {
    return Promise.resolve(this.client.size)
  }

  // Fake connection to fake server
  on(event: string, callback: () => void) {
    if (event === 'connect') {
      callback()
    }
    return this
  }

  connect(): Promise<this> {
    return Promise.resolve(this)
  }
}

export const createClient = new MockedRedis()
