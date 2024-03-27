export class PromiseCache<T, U> {
  private cache: Map<T, { value: U; timestamp: number }>
  private readonly ttl: number // Time to live in milliseconds

  constructor(ttlInSeconds: number) {
    this.cache = new Map()
    this.ttl = ttlInSeconds * 1000 // Convert seconds to milliseconds
  }

  async wrap(key: T, delegate: () => Promise<U>, ttlInSeconds?: number): Promise<U> {
    const now = Date.now()
    const cached = this.cache.get(key)

    // Determine the TTL for this specific call
    const effectiveTTL = ttlInSeconds !== undefined ? ttlInSeconds * 1000 : this.ttl;

    if (cached && now - cached.timestamp < effectiveTTL) {
      // Return the cached response if it's not expired
      return cached.value
    }

    // Execute the delegate, cache the response with the current timestamp, and return it
    const response = await delegate()
    this.cache.set(key, { value: response, timestamp: now })
    return response
  }
}
