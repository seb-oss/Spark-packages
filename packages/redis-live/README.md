# @sebspark/redis-live

A local, in-memory map in every process, backed by Redis and eventually consistent between processes. It makes settings and data shared between processes as easy to use as a local `Map`. Built on Redis publish/subscribe and [node-redis](https://github.com/redis/node-redis) (the `redis` package).

Work with the map as if it were local: `get` and `has` read from memory, synchronously; `set` and `del` change memory at once. In the background, every write is stored in Redis and published, and every other process holding the map applies it and tells you exactly what changed, including entries that expire. Redis is the backing store, so a process that starts or reconnects loads every entry from there.

Processes see each other's writes shortly after they happen, not at the same instant. All of them end up with the same value as Redis. Full consistency between processes can never be guaranteed anyway; redis-live gives you eventual consistency without making you wait for it.

Made for hot paths that cannot afford a round trip per lookup. For example, a service saves user preferences with `set()`, while every worker that decides on incoming events whether to notify a user reads them with `get()` from memory. Because the methods mirror a Redis client's, code that reads a Redis cache can switch over with few changes.

## The cost: memory

Every process holds every entry in memory, so lookups take micro- rather than milliseconds. That speed is paid for in memory, once per process.

For example, 700,000 users with an id, a push token, an X-Wing public key (1,216 bytes, base64) and a locale take about 2 KB each in Node, around 1.3 GB of heap per process. With four processes, that is over 5 GB.

It is worth it only where lookups must take micro- to milliseconds, faster than a round trip to Redis allows. Otherwise, use Redis directly.

## Install

```bash
npm install @sebspark/redis-live redis
```

## Define a collection

Every process that uses the collection defines it the same way, so they agree on where entries live and how changes are announced.

```ts
import { defineCollection } from '@sebspark/redis-live'

type UserPrefs = {
  userId: string
  channels: string[]
  quietHours: { from: string; to: string } | null
}

export const userPrefs = defineCollection<UserPrefs>({
  namespace: 'user_prefs',
  key: 'userId', // must be a property of UserPrefs
})
```

| Option | Meaning |
| --- | --- |
| `namespace` | Namespace of the collection, like a table name. |
| `key` | Property of an entry that holds its id. Its value must be a string. |
| `channel` | Optional. Channel the changes are published on. Default: `<namespace>:changed`. |

Each entry is stored as JSON under its own Redis key, `<namespace>:<id>`. The entry `{ userId: 'anna', ... }` above is stored as `user_prefs:anna`.

Entries are JSON objects: their values can be objects, arrays, strings, numbers, booleans and `null`. A `Date` arrives as an ISO string.

## Use a live collection

```ts
import { createClient } from 'redis'
import { live } from '@sebspark/redis-live'
import { userPrefs } from './collections'

const client = await createClient({ url }).connect()

const prefs = await live(userPrefs, { client })

prefs.get('anna')  // the entry, from memory, or null
prefs.has('anna')  // whether an entry exists, from memory

await prefs.set({ userId: 'anna', channels: ['push'], quietHours: null })
await prefs.del('anna')
```

`await live()` resolves when every entry is loaded, so `get` is ready to use from then on.

`get` and `has` read from memory and return right away; they never touch Redis. `set` and `del` update memory immediately, then write to Redis and return a promise that resolves when Redis has stored and published the change.

So once `live()` has resolved, the collection can be used as if it were synchronous: read with `get`, write with `set` and `del` without awaiting them, and every later `get` already sees the write.

Code written against a Redis client usually keeps working: `await prefs.get(id)` returns the entry, because `await` accepts plain values. Only code that calls `.then()` on the result of `get` needs changing.

`live()` duplicates the client you give it (`client.duplicate()`) for its subscription, because a Redis connection that subscribes cannot run other commands. It uses your client for loading and writing entries.

| Option | Meaning |
| --- | --- |
| `client` | A connected `redis` client, created with `createClient()`. Clients using `RESP: 2` are not supported. |

### Writing

`set` takes the id from the entry's `key` property. `set` and `del` change memory first, so `get` returns the change right away, and emit `add`, `update` or `delete` at once. Then they run the write and the publish in one `MULTI` transaction, so no process hears about a change that was not stored, and a stored change is always announced.

Every process applies changes in the order Redis published them, including its own, which come back over the subscription. If another process wrote the same entry just before, its change can show briefly, until this process's own change arrives and is applied again. All processes end on the same value as Redis.

If the write fails, the entry is read back from Redis, so memory never keeps a change Redis does not have, and the failure is reported as an `error` event (see [Errors](#errors)).

### Entries that expire

`set` takes the same `expiration` option as node-redis's `SET`:

```ts
await prefs.set(entry, {
  expiration: { type: 'PX', value: 60_000 }, // or EX, EXAT, PXAT
})
```

Redis deletes the key when it expires and announces it as an expired-key event; every process then removes the entry and emits `expired`. Redis only sends those events if its `notify-keyspace-events` setting includes expired events (`E` and `x`, e.g. `Ex`). It is off by default:

```bash
redis-cli CONFIG SET notify-keyspace-events Ex
```

Like every `set`, a `set` with an `expiration` changes memory at once. Before writing to Redis, it checks this setting once per live collection. If expired events are not enabled, the write is refused like any write Redis refuses (see [Errors](#errors)), because processes would otherwise keep expired entries forever. On managed Redis services that disable `CONFIG`, enable it through the service's own settings.

### Events

```ts
prefs.on('add', (entry) => {})     // an entry that was not in memory
prefs.on('update', (entry) => {})  // an entry that was in memory and changed
prefs.on('delete', (id) => {})     // an entry removed with del
prefs.on('expired', (id) => {})    // an entry that expired

prefs.on('change', (type, payload) => {
  // every add, update, delete and expired; payload is an entry, or an id for 'delete' and 'expired'
})
```

Events report every change after `live()` resolves, whichever process made it, this one included; a process's own `set` or `del` emits at once. The entries loaded at startup do not emit `add`, and an entry that arrives identical to the one already in memory emits nothing. `on`, `once` and `off` behave like Node's `EventEmitter`, but only accept these events and `error`, so a misspelled event name is a type error.

### Errors

```ts
prefs.on('error', (error) => {
  logger.error(error) // a failed write, or the entries could not be read again after a reconnect
})
```

A lost connection is not an error: node-redis reconnects on its own, and the collection loads again.

Failures are reported on the live object, like Node's `EventEmitter`: with an `error` listener, they go to it. Without one, the error is thrown. For a failed `set` or `del`, that means its promise rejects, so a write that nobody awaits ends the process like any unhandled rejection. Add an `error` listener when you write without awaiting.

### What `live()` does

1. Subscribes to the collection's channel and to Redis's expired-key events.
2. Only after subscribing, loads every entry: `SCAN` for `<namespace>:*`, then `MGET`. Changes that arrive meanwhile are held and applied after, so none slips in between.
3. On each message, applies the entry it carries, or deletes the id.
4. On each expired-key event for one of the collection's keys, removes that id.
5. On reconnect, loads every entry again, because messages published while disconnected are not replayed. Events are emitted for the difference between before and after.

## Schema changes

Processes deploy separately, so for a while they disagree on the shape of an entry. To add a property:

1. **Deploy the processes that read it** so they accept the property being missing.
2. **Deploy the processes that write it.**

Entries written before then do not have the property until they are written again. Type it as optional, e.g. `locale?: string`. To remove a property, stop reading it first, then stop writing it. Never change the `key` property or the namespace in place; treat that as a new collection.

## Guarantees and limits

- Eventually consistent: after a write, other processes may still read the old value until the message reaches them. When two processes write the same entry at once, the one Redis publishes last wins, everywhere.
- A `set` or `del` and its message are one `MULTI` transaction.
- Changes are applied in the order Redis published them, in every process.
- Messages are delivered to connected subscribers, in the order they were published. There is no replay; that is why `live()` loads every entry again on reconnect.
- Redis sends an expired-key event when it actually deletes the key. That happens when the key is next accessed or when Redis's background expiry finds it, so it can come somewhat after the expiry time.
- Expired-key events are sent per database (`__keyevent@<db>__:expired`); `live()` listens on the database its client uses.

## Graceful shutdown

```ts
process.on('SIGTERM', async () => {
  await prefs.close() // wait for pending writes, unsubscribe, close the duplicated connection
  // ... then close the HTTP server and your client
})
```

## Non-goals

- Not for entries written outside redis-live. Every write must go through `set` or `del`, or other processes will not hear about it. Expiry is the only exception.
- Not a durable message queue. If delivery must not be missed, use Redis Streams or a real queue.
- Not a query layer. A collection is every entry in one namespace.
