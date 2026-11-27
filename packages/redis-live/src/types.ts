/**
 * The payload of each event: the entry for `add` and `update`, the id for
 * `delete` and `expired`.
 */
export type Events<T, K extends keyof T> = {
  add: T
  update: T
  delete: T[K]
  expired: T[K]
}

/** Listener for `change`: called with the event type, and its payload narrowed by that type. */
export type ChangeListener<T, K extends keyof T> = (
  ...args: {
    [E in keyof Events<T, K>]: [type: E, payload: Events<T, K>[E]]
  }[keyof Events<T, K>]
) => void

type Subscribe<T, K extends keyof T, Self> = {
  <E extends keyof Events<T, K>>(
    event: E,
    listener: (payload: Events<T, K>[E]) => void
  ): Self
  (event: 'change', listener: ChangeListener<T, K>): Self
  (event: 'error', listener: (error: unknown) => void): Self
}

/** Every entry of a collection, kept current: reads, events and close. */
export type Live<T, K extends keyof T> = {
  /** Whether an entry exists for `id`. Reads from memory. */
  has(id: T[K]): boolean
  /** The entry for `id`, or `null`, like Redis. Reads from memory. */
  get(id: T[K]): T | null
  on: Subscribe<T, K, Live<T, K>>
  once: Subscribe<T, K, Live<T, K>>
  off: Subscribe<T, K, Live<T, K>>
  /**
   * Waits for pending writes, then stops applying changes. Safe to call more
   * than once: every call resolves when closing has finished.
   */
  close(): Promise<void>
}
