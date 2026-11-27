import type { RedisClientType } from 'redis'
import { type Collection, redisKey } from './collection'
import { createStore } from './store'
import type { Live } from './types'

export type WriteOptions = {
  /** The same as node-redis's `SET` expiration. Needs expired-key events. */
  expiration?: { type: 'EX' | 'PX' | 'EXAT' | 'PXAT'; value: number }
}

/** A live collection: reads from memory, writes through Redis, events for every change. */
export type LiveCollection<T, K extends keyof T = keyof T> = Live<T, K> & {
  /** Stores the entry, changing memory at once. Resolves when Redis has stored and published it. */
  set(entry: T, options?: WriteOptions): Promise<void>
  /** Deletes the entry, changing memory at once. Resolves when Redis has deleted and published it. */
  del(id: T[K]): Promise<void>
}

export type LiveOptions = {
  /** A connected `redis` client. Duplicated for the subscription. */
  client: RedisClientType
}

type Message<T, K extends keyof T> = { set: T } | { del: T[K] }

/**
 * Keeps every entry of `collection` in memory and applies every change as it
 * arrives. Resolves when the entries are loaded.
 */
export const live = async <T, K extends keyof T>(
  collection: Collection<T, K>,
  { client }: LiveOptions
): Promise<LiveCollection<T, K>> => {
  const prefix = `${collection.namespace}:`
  const pending = new Set<Promise<void>>()

  // A subscribing connection cannot run other commands, so it gets its own.
  // node-redis reconnects it on its own, so a lost connection is not an error.
  const subscriber = client.duplicate()
  subscriber.on('error', () => {})

  const store = createStore<T, K>(collection.key, async () => {
    await Promise.allSettled([...pending])
    await subscriber.close()
  })

  // On a later tick, so a thrown error (no `error` listener) cannot stop the queue
  const report = (error: unknown) => {
    setImmediate(() => store.fail(error))
  }

  // The caller declares the entry type through the collection's type parameter
  const parse = (text: string): T => JSON.parse(text)
  const parseMessage = (text: string): Message<T, K> => JSON.parse(text)
  // biome-ignore lint/plugin/no-type-assertion: ids are strings, by the collection's contract
  const idFrom = (key: string) => key.slice(prefix.length) as T[K]

  const readAll = async () => {
    const keys: string[] = []
    for await (const batch of client.scanIterator({
      MATCH: `${prefix}*`,
      COUNT: 1000,
    })) {
      keys.push(...batch)
    }
    if (keys.length === 0) return []
    const values = await client.mGet(keys)
    return values.flatMap((value) => (value === null ? [] : [parse(value)]))
  }

  const hydrate = async () => store.replaceAll(await readAll())

  const apply = (text: string) => {
    const message = parseMessage(text)
    if ('set' in message) store.upsert(message.set)
    else store.remove(message.del)
  }

  // Changes are applied one at a time, in the order they arrived, and only
  // once the first load has run
  let startLoading = () => {}
  const subscribed = new Promise<void>((resolve) => {
    startLoading = resolve
  })
  const loaded = subscribed.then(hydrate)
  let queue: Promise<void> = loaded.catch(() => {})
  const enqueue = (task: () => void | Promise<void>) => {
    queue = queue.then(task).catch(report)
  }

  // Messages sent while disconnected are not replayed, so load again
  let connectedBefore = false
  subscriber.on('ready', () => {
    if (connectedBefore) enqueue(hydrate)
    connectedBefore = true
  })

  const database = client.options?.database ?? 0
  await subscriber.connect()
  await subscriber.subscribe(collection.channel, (text) =>
    enqueue(() => apply(text))
  )
  await subscriber.subscribe(`__keyevent@${database}__:expired`, (key) => {
    if (key.startsWith(prefix)) enqueue(() => store.expire(idFrom(key)))
  })
  startLoading()

  await loaded.catch(async (error) => {
    await store.live.close()
    throw error
  })

  const track = (write: Promise<void>) => {
    pending.add(write)
    const forget = () => {
      pending.delete(write)
    }
    write.then(forget, forget)
    return write
  }

  // Memory has already changed; if Redis refuses, go back to what Redis has
  const persist = async (id: T[K], write: () => Promise<unknown>) => {
    try {
      await write()
    } catch (error) {
      const stored = await client.get(redisKey(collection, id))
      if (stored === null) store.remove(id)
      else store.upsert(parse(stored))
      // To `error` listeners, or thrown, which rejects this write
      store.fail(error)
    }
  }

  let expiredEventsChecked = false
  const checkExpiredEvents = async () => {
    if (expiredEventsChecked) return
    const config = await client.configGet('notify-keyspace-events')
    const flags = config['notify-keyspace-events'] ?? ''
    if (!flags.includes('E') || !(flags.includes('x') || flags.includes('A'))) {
      throw new Error(
        'Redis does not send expired-key events, so expired entries would stay in memory. Set notify-keyspace-events to include E and x, e.g. "Ex".'
      )
    }
    expiredEventsChecked = true
  }

  const set = (entry: T, { expiration }: WriteOptions = {}) => {
    store.upsert(entry)
    return track(
      persist(entry[collection.key], async () => {
        if (expiration) await checkExpiredEvents()
        await client
          .multi()
          .set(
            redisKey(collection, entry[collection.key]),
            JSON.stringify(entry),
            expiration ? { expiration } : undefined
          )
          .publish(collection.channel, JSON.stringify({ set: entry }))
          .exec()
      })
    )
  }

  const del = (id: T[K]) => {
    store.remove(id)
    return track(
      persist(id, () =>
        client
          .multi()
          .del(redisKey(collection, id))
          .publish(collection.channel, JSON.stringify({ del: id }))
          .exec()
      )
    )
  }

  return Object.assign(store.live, { set, del })
}
