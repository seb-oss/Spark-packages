/** The payload of each event: the row for `add` and `update`, the key for `delete`. */
export type Events<T, K extends keyof T> = { add: T; update: T; delete: T[K] }

/** Listener for `change`: called with the event type, and its payload narrowed by that type. */
export type ChangeListener<T, K extends keyof T> = (
  ...args: {
    [E in keyof Events<T, K>]: [type: E, payload: Events<T, K>[E]]
  }[keyof Events<T, K>]
) => void

type Subscribe<T, K extends keyof T> = {
  <E extends keyof Events<T, K>>(
    event: E,
    listener: (payload: Events<T, K>[E]) => void
  ): Live<T, K>
  (event: 'change', listener: ChangeListener<T, K>): Live<T, K>
  (event: 'error', listener: (error: unknown) => void): Live<T, K>
}

/**
 * All rows of a live table, kept current. Exposes only reads and events; the
 * rows are written by pg-live alone.
 */
export type Live<T, K extends keyof T> = Pick<Map<T[K], T>, 'has' | 'get'> & {
  on: Subscribe<T, K>
  once: Subscribe<T, K>
  off: Subscribe<T, K>
  /**
   * Stops applying changes and removes all listeners. Safe to call more than
   * once: every call resolves when closing has finished.
   */
  close(): Promise<void>
}
