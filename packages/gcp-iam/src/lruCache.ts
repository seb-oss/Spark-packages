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
    const hasKey = this.values.has(key)

    if (hasKey) {
      // peek the entry, re-insert for LRU strategy
      const entry = this.values.get(key) as {
        timestamp: number
        data: T
        ttl: number
      }
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.values.delete(key)
        return undefined
      }
      this.values.delete(key)
      this.values.set(key, entry)
      return entry.data
    }
  }

  public put(key: string, value: T, ttl?: number) {
    if (this.values.size >= this.maxEntries) {
      // least-recently used cache eviction strategy
      const keyToDelete = this.values.keys().next().value as string
      this.values.delete(keyToDelete)
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
