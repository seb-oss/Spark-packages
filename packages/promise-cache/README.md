# `@sebspark/promise-cache`

A simple caching wrapper for promises.

```typescript
/*
 * Pseudocode example.
 */
import { PromiseCache } from '@sebspark/promise-cache'

// Instantiate the cache with a TTL.
const cache = new PromiseCache<number>(60, true, true) // 1 minute cache TTL / is case sensitive / use local storage

const redisCache = new PromiseCache<number>(60, false, false) // 1 minute cache TTL / is not case sensitive / use redis storage

// Use the cache wrapper for a database query to relieve the database.
const query = 'SELECT username FROM users ORDER BY created DESC LIMIT 1'
const newestUser = await cache.wrap('newestUser', () => database.query(query))

// Use the cache wrapper for a database query to relieve the database.
const query = 'SELECT username FROM users ORDER BY created DESC LIMIT 1'
const newestUser = await redisCache.wrap('newestUserRedis', () => database.query(query))
```