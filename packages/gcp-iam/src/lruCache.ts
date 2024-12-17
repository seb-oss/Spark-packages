export class LruCache<T> {
  private values: Map<string, { timestamp: number; data: T }> = new Map<
    string,
    { timestamp: number; data: T }
  >()
  private readonly maxEntries: number = 10000
  private readonly ttl: number = 1000 * 60 * 10 // 1 minute

  constructor(props?: { ttl?: number; maxEntries?: number }) {
    this.ttl = props?.ttl ?? this.ttl
    this.maxEntries = props?.maxEntries ?? this.maxEntries
  }

  public get(key: string): T | undefined {
    const hasKey = this.values.has(key)

    if (hasKey) {
      // peek the entry, re-insert for LRU strategy
      const entry = this.values.get(key) as { timestamp: number; data: T }
      if (Date.now() - entry.timestamp > this.ttl) {
        this.values.delete(key)
        return undefined
      }
      this.values.delete(key)
      this.values.set(key, entry)
      return entry.data
    }
  }

  public put(key: string, value: T) {
    if (this.values.size >= this.maxEntries) {
      // least-recently used cache eviction strategy
      const keyToDelete = this.values.keys().next().value as string
      this.values.delete(keyToDelete)
    }

    this.values.set(key, { data: value, timestamp: Date.now() })
  }
}
