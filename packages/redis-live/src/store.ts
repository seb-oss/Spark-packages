import { EventEmitter } from 'node:events'
import { isDeepStrictEqual } from 'node:util'
import type { ChangeListener, Events, Live } from './types'

type AnyListener<T, K extends keyof T> =
  | ((payload: Events<T, K>[keyof Events<T, K>]) => void)
  | ChangeListener<T, K>
  | ((error: unknown) => void)

type EventName<T, K extends keyof T> = keyof Events<T, K> | 'change' | 'error'

class LiveEntries<T, K extends keyof T> {
  readonly #entries: ReadonlyMap<T[K], T>
  readonly #events: EventEmitter
  readonly #close: () => Promise<void>

  constructor(
    entries: ReadonlyMap<T[K], T>,
    events: EventEmitter,
    close: () => Promise<void>
  ) {
    this.#entries = entries
    this.#events = events
    this.#close = close
  }

  has(id: T[K]): boolean {
    return this.#entries.has(id)
  }

  get(id: T[K]): T | null {
    return this.#entries.get(id) ?? null
  }

  on<E extends keyof Events<T, K>>(
    event: E,
    listener: (payload: Events<T, K>[E]) => void
  ): this
  on(event: 'change', listener: ChangeListener<T, K>): this
  on(event: 'error', listener: (error: unknown) => void): this
  on(event: EventName<T, K>, listener: AnyListener<T, K>): this {
    this.#events.on(event, listener)
    return this
  }

  once<E extends keyof Events<T, K>>(
    event: E,
    listener: (payload: Events<T, K>[E]) => void
  ): this
  once(event: 'change', listener: ChangeListener<T, K>): this
  once(event: 'error', listener: (error: unknown) => void): this
  once(event: EventName<T, K>, listener: AnyListener<T, K>): this {
    this.#events.once(event, listener)
    return this
  }

  off<E extends keyof Events<T, K>>(
    event: E,
    listener: (payload: Events<T, K>[E]) => void
  ): this
  off(event: 'change', listener: ChangeListener<T, K>): this
  off(event: 'error', listener: (error: unknown) => void): this
  off(event: EventName<T, K>, listener: AnyListener<T, K>): this {
    this.#events.off(event, listener)
    return this
  }

  close(): Promise<void> {
    return this.#close()
  }
}

/**
 * The in-memory entries behind `live()`. `live` is handed to callers;
 * `upsert`, `remove`, `expire`, `replaceAll` and `fail` are for redis-live only.
 */
export const createStore = <T, K extends keyof T>(
  key: K,
  onClose: () => void | Promise<void> = () => {}
) => {
  const entries = new Map<T[K], T>()
  const events = new EventEmitter()
  let closed = false

  const upsert = (entry: T) => {
    if (closed) return
    const id = entry[key]
    const exists = entries.has(id)
    if (exists && isDeepStrictEqual(entries.get(id), entry)) return
    const type = exists ? 'update' : 'add'
    entries.set(id, entry)
    events.emit(type, entry)
    events.emit('change', type, entry)
  }

  const removeAs = (type: 'delete' | 'expired') => (id: T[K]) => {
    if (closed || !entries.delete(id)) return
    events.emit(type, id)
    events.emit('change', type, id)
  }

  // Applies a full read of the collection, emitting only what differs
  const replaceAll = (next: T[]) => {
    if (closed) return
    const nextIds = new Set(next.map((entry) => entry[key]))
    for (const id of [...entries.keys()]) {
      if (!nextIds.has(id)) removeAs('delete')(id)
    }
    for (const entry of next) upsert(entry)
  }

  // Reports an error like EventEmitter: to `error` listeners, or thrown if there are none
  const fail = (error: unknown) => {
    if (closed) return
    events.emit('error', error)
  }

  let closing: Promise<void> | undefined
  const live: Live<T, K> = new LiveEntries<T, K>(entries, events, () => {
    closing ??= (async () => {
      // Pending writes still apply, so the entries close only after them
      await onClose()
      closed = true
      events.removeAllListeners()
    })()
    return closing
  })

  return {
    live,
    upsert,
    remove: removeAs('delete'),
    expire: removeAs('expired'),
    replaceAll,
    fail,
  }
}
