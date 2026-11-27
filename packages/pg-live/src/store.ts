import { EventEmitter } from 'node:events'
import { isDeepStrictEqual } from 'node:util'
import type { ChangeListener, Events, Live } from './types'

type AnyListener<T, K extends keyof T> =
  | ((payload: Events<T, K>[keyof Events<T, K>]) => void)
  | ChangeListener<T, K>
  | ((error: unknown) => void)

type EventName<T, K extends keyof T> = keyof Events<T, K> | 'change' | 'error'

class LiveTable<T, K extends keyof T> {
  readonly #rows: ReadonlyMap<T[K], T>
  readonly #events: EventEmitter
  readonly #close: () => Promise<void>

  constructor(
    rows: ReadonlyMap<T[K], T>,
    events: EventEmitter,
    close: () => Promise<void>
  ) {
    this.#rows = rows
    this.#events = events
    this.#close = close
  }

  has(key: T[K]): boolean {
    return this.#rows.has(key)
  }

  get(key: T[K]): T | undefined {
    return this.#rows.get(key)
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
 * The in-memory rows behind `live()`. `live` is handed to consumers; `upsert`,
 * `remove`, `replaceAll` and `fail` are for pg-live only.
 */
export const createStore = <T, K extends keyof T>(
  key: K,
  onClose: () => void | Promise<void> = () => {}
) => {
  const rows = new Map<T[K], T>()
  const events = new EventEmitter()
  let closed = false

  const upsert = (row: T) => {
    if (closed) return
    const id = row[key]
    const exists = rows.has(id)
    if (exists && isDeepStrictEqual(rows.get(id), row)) return
    const type = exists ? 'update' : 'add'
    rows.set(id, row)
    events.emit(type, row)
    events.emit('change', type, row)
  }

  const remove = (id: T[K]) => {
    if (closed || !rows.delete(id)) return
    events.emit('delete', id)
    events.emit('change', 'delete', id)
  }

  // Applies a full read of the table, emitting only what differs
  const replaceAll = (next: T[]) => {
    if (closed) return
    const nextIds = new Set(next.map((row) => row[key]))
    for (const id of [...rows.keys()]) {
      if (!nextIds.has(id)) remove(id)
    }
    for (const row of next) upsert(row)
  }

  // Reports an error like EventEmitter: to `error` listeners, or thrown if there are none
  const fail = (error: unknown) => {
    if (closed) return
    events.emit('error', error)
  }

  let closing: Promise<void> | undefined
  const live: Live<T, K> = new LiveTable<T, K>(rows, events, () => {
    closing ??= (async () => {
      closed = true
      events.removeAllListeners()
      await onClose()
    })()
    return closing
  })

  return { live, upsert, remove, replaceAll, fail }
}
