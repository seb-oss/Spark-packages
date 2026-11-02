export class LruCache<T> {
  private values: Map<string, { timestamp: number; data: T; ttl: number }> =
    new Map<string, { timestamp: number; data: T; ttl: number }>()
  private readonly maxEntries: number = 10000
  private readonly defaultTTL: number = 1000 * 10 // 10 seconds

  constructor(props?: { ttl?: number; maxEntries?: number }) {
    this.defaultTTL = props?.ttl ?? this.defaultTTL
    this.maxEntries = props?.maxEntries ?? this.maxEntries
  }

  public get(key: string): T | undefined {
    const entry = this.values.get(key)
    if (!entry) return undefined

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.values.delete(key)
      return undefined
    }
    // re-insert for LRU strategy
    this.values.delete(key)
    this.values.set(key, entry)
    return entry.data
  }

  public put(key: string, value: T, ttl?: number) {
    if (this.values.size >= this.maxEntries) {
      // least-recently used cache eviction strategy
      const keyToDelete = this.values.keys().next().value
      if (keyToDelete !== undefined) this.values.delete(keyToDelete)
    }

    this.values.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    })
  }

  public clear(key: string) {
    this.values.delete(key)
  }
}
