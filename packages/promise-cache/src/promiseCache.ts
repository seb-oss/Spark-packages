export class PromiseCache<T, U> {
  private cache: Map<T, { value: U; timestamp: number }>
  private readonly ttl: number // Time to live in milliseconds

  constructor(ttlInSeconds: number) {
    this.cache = new Map()
    this.ttl = ttlInSeconds * 1000 // Convert seconds to milliseconds
  }

  async wrap(key: T, delegate: () => Promise<U>): Promise<U> {
    const now = Date.now()
    const cached = this.cache.get(key)

    console.log('cached', cached && now - cached.timestamp < this.ttl)

    if (cached && now - cached.timestamp < this.ttl) {
      // Return the cached response if it's not expired
      console.log('used cache')
      return cached.value
    }

    console.log('cache this...')
    // Execute the delegate, cache the response with the current timestamp, and return it
    const response = await delegate()
    this.cache.set(key, { value: response, timestamp: now })
    return response
  }
}
