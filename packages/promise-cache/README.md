# `@sebspark/promise-cache`

Simple caching wrapper

## **Features**

- **PromiseCache**: Simple caching wraper for promises
- **Persistor**: Simple Key/Value caching wrapper, can be used with redis or with local memory.
  
## **Installation**

To install promise-cache, use `yarn`:

```bash
yarn install @sebspark/promise-cache
```
## **Usage**

### **PromiseCache Class**

| Params        | Type     | Default |Description                                  |
|---------------|----------|---------|---------------------------------------------|
| redis         | RedisClientOptions   |    undefined     |Redis instance url, skip if use local memory |
| ttlInSeconds  | number   |   undefined      |Persist time in Seconds                      |
| caseSensituve | boolean  |   false    |Retrieving cache with case sensitive         |
| onSuccess     | function |    undefined     |Callback function if connection is success   |
| onError       | function |    undefined     |Callback function if there is an error       |
| logger        | winston Logger |    undefined     |Logger                                 |

```typescript
import { PromiseCache } from '@sebspark/promise-cache'

// with redis
const cacheInRedis = new PromiseCache<T>({
  redis: REDIS_URL,
  ttlInSeconds: ttl,
  caseSensitive: true
})

// without redis
const cacheLocalMemory = new PromiseCache<T>({
  ttlInSeconds: ttl,
  caseSensitive: true
})
```

## **PromiseCache Methods**

```typescript
// Wrap
/* Simple promise cache wrapper
 * @param key Cache key.
 * @param delegate The function to execute if the key is not in the cache.
 * @param ttlInSeconds Time to live in seconds.
 * @param ttlKeyInSeconds The key in the response object that contains the TTL.
 * @returns The result of the delegate function.
*/
const ttl = 5 // 5 seconds
const delegate = new Promise((reject, resolve) => { resolve(123)})
const response = await cacheInRedis.wrap('Key', delegate, ttl)
expect(response).toBe(123)

// Size
/*
* Cache size
* @returns The number of entries in the cache
*/

const entries = await cacheInRedis.size()
expect(entries).toBe(1)

// Find
 /**
* Get a value from the cache.
* @param key Cache key.
*/

const cachedValue = await cacheInRedis.find('Key')
expect(cachedValue).toBe(123)

// Override
/**
 * Set a value in the cache.
 * @param key Cache key.
 * @param value Cache value.
 * @param ttlInSeconds? Time to live in seconds.
 */

await cacheInRedis.override('Key', 234) // keep the same ttl
const cached = cacheInRedis.find('Key')
expect(cached).toBe(234)
```

### **Persistor Class**

| Params        | Type     | Default |Description                                  |
|---------------|----------|---------|---------------------------------------------|
| redis         | RedisClientOptions   |    undefined     |Redis instance url, skip if use local memory |
| onSuccess     | function |    undefined     |Callback function if connection is success   |
| onError       | function |    undefined     |Callback function if there is an error       |
| logger        | winston Logger |    undefined     |Logger                                 |
| clientId        | any |    undefined     |Object internal id                                 |

```typescript
import { Persistor } from '@sebspark/promise-cache'

// with redis
const store = new Persistor<T>({
  redis: REDIS_URL,
})

// without redis
const store = new Persistor<T>()
```

## **Persistor Methods**

```typescript

/**
* Size
* @returns The number of entries in the cache
*/

const size = await store.size()
expect(size).toBe(0)

/**
* Set
* Set a value in the cache.
* @param key Cache key.
* @param object.value Value to set in the cache.
* @param object.ttl Time to live in seconds.
* @param object.timestamp Timestamp
*/

await store.set<number>('MyKey', {
  value: 123,
  ttl: 10               // In seconds, default undefined
  timestamp: Date.now() // default Date.now()
})

/**
 * Get a value from the cache.
 * @param key Cache key.
 * @returns GetType<T> value
 */

const cached = await store.get('MyKey')
expect(cached).toBe({
  value: 43,
  ttl: 10,
  timestamp: // The timestamp
})

/**
 * Delete a value from the cache.
 * @param key Cache key
 */

await store.delete('MyKey')
expect(await store.get('MyKey').toBe(null)
```
