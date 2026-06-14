# `@sebspark/memredis`

An in-memory implementation of Redis. Fully compatible with the Redis client API for development, testing, and scenarios where an in-memory store suffices.

## Features

- **Full Redis-like API** — supports strings, hashes, lists, sets, and sorted sets with optional expiration
- **Pub/Sub** — subscribe to channels and publish messages, coordinating across multiple in-memory clients
- **WRONGTYPE enforcement** — throws when the wrong command type is used on a key, matching real Redis behaviour
- **Test container parity** — e2e tests verify behavior matches real Redis exactly

## Installation

```bash
yarn add @sebspark/memredis
```

## Usage

### Basic example

```typescript
import { MemRedis } from '@sebspark/memredis'

const client = new MemRedis()

// Set and get
await client.set('key', 'value')
const value = await client.get('key') // 'value'

// Expiration
await client.setEx('temp-key', 60, 'expires in 60 seconds')
const ttl = await client.ttl('temp-key') // ~60

// Delete
await client.del('key')
```

### Hashes

```typescript
const client = new MemRedis()

await client.hSet('user:1', { name: 'Alice', age: '30' })
const user = await client.hGetAll('user:1') // { name: 'Alice', age: '30' }
await client.hDel('user:1', 'age')
```

### Lists, sets, sorted sets

```typescript
const client = new MemRedis()

// Lists
await client.lPush('queue', ['job1', 'job2'])
const job = await client.lPop('queue') // 'job2'

// Sets
await client.sAdd('tags', ['a', 'b', 'c'])
const members = await client.sMembers('tags') // ['a', 'b', 'c']

// Sorted sets
await client.zAdd('leaderboard', { score: 100, value: 'alice' })
const top = await client.zRangeWithScores('leaderboard', 0, 0, { REV: true })
```

### Pub/Sub

All `MemRedis` instances share the same pub/sub bus, matching real Redis behaviour where all clients connect to the same server.

If you type against `IPersistor`, pub/sub subscription methods use transport-specific return values. `MemRedis` returns subscription counts, while `redis` clients resolve those methods without a value.

```typescript
import { MemRedis } from '@sebspark/memredis'

const publisher = new MemRedis()
const subscriber = new MemRedis()

await subscriber.subscribe('events', (message) => {
  console.log('Received:', message)
})

await publisher.publish('events', 'hello world')
```

## Development and testing

Use MemRedis in tests to avoid Docker overhead while still maintaining Redis-compatible behavior. The e2e test suite verifies MemRedis behavior matches actual Redis exactly.

```typescript
import { describe, it, expect } from 'vitest'
import { MemRedis } from '@sebspark/memredis'

describe('my cache', () => {
  it('stores and retrieves values', async () => {
    const cache = new MemRedis()
    await cache.set('key', 'value')
    expect(await cache.get('key')).toBe('value')
  })
})
```

## Limitations

- Single-process only — not suitable for multi-process or distributed scenarios
- No persistence — data is lost when the process exits
- No cluster support
- No Redis modules

For production use cases requiring Redis features, use the official [`redis`](https://www.npmjs.com/package/redis) package.
