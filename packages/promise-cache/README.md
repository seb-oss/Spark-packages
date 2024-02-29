# `@sebspark/promise-cache`

A simple caching wrapper for promises.

## Example

```typescript
/*
 * Pseudocode example.
 */

// Instantiate the cache with a TTL.
const cache = new PromiseCache<string, number>(60) // 1 minute cache TTL.

// Use the cache wrapper for a database query to relieve the database.
const query = 'SELECT username FROM users ORDER BY created DESC LIMIT 1'
const newestUser = await cache.wrap('newestUser', () => database.query(query))
```
