# `@sebspark/promise-cache`

Simple caching wrapper

# PromiseCache implementation

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

| Params        | Type                | Default   | Description                                   |
|---------------|---------------------|-----------|-----------------------------------------------|
| redis         | RedisClientOptions  | undefined | Redis instance url, skip if use local memory  |
| ttlInSeconds  | number              | undefined | Persist time in Seconds                       |
| caseSensituve | boolean             | false     | Retrieving cache with case sensitive          |
| onSuccess     | function            | undefined | Callback function if connection is success    |
| onError       | function            | undefined | Callback function if there is an error        |
| logger        | winston Logger      | undefined | Logger                                        |

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

# Cache implementation

The basic functionality of this new implementation is:

1. You create a persistor to store your cached data. This can be the built in `InMemoryPersistor` or a `Redis` client
2. You create a cache by calling `createCache(persistor, 'optional-prefix')`
3. You call the cache's wrap function to wrap your original function(s)
4. You call the wrapped function(s) instead of the originals

** Why the change? **

When trying to add support for caching _to_ a specified time in addition to _for_ a specified time, it tuyrned out to be hard given the original implementation. Changing the implementation proved hard without breaking changes. So a new implementation is is.

## How to use it

```typescript
import { createClient } from 'redis'
import { createCache } from '@sebspark/promise-cache'
import { myFunction } from './some_function'

const run = async () => {
  // Create your persistor
  const persistor = createClient({ url: 'redis' })
  await persistor.connect() // This is not handled by the cache

  // Create your cache and give it a prefix
  const cache = createCache(persistor, 'my-prefix')
  
  // wrap your function
  const myCachedFunction = cache.wrap(myFunction, {
    key: 'my-function', // cached data will be stored with the key 'my-prefix:my-function'
    expiry: 100, // ttl will be 100 ms
  })

  // call the wrapped function
  const response = await myCachedFunction() // the wrapped function will have the same signature as the original
}

run()
```

### Keys

Keys can be constructed in two ways: as a fixed string or as a function that generates a string. The generator will accept the arguments of the wrapped function.

```typescript
const cache = createCache(persistor, 'api')

const getById = async (id: string): Promise<Data> => {
  // Something gets called
}

const cachedGetById = cache.wrap(myApiCall, {
  key: (id) => `getById:${id}`
})

const result = await cachedGetById('foo')

// key will be 'api:getById:foo'
```

### Expiry

Expiration can be set as either a number (number of milliseconds from now) or a Date (exact expiry time). It can be set either as a value (`number | Date`) or as a function that generates a value (`number | Date`). The generator will accept the arguments _and_ the response of the wrapped function.

```typescript
const cache = createCache(persistor, 'api')

type Data = {
  value: number
  expires: string // ISO6501 date time string
}

const getById = async (id: string): Promise<Data> => {
  // Something gets called
}

const cachedGetById = cache.wrap(myApiCall, {
  key: (id) => `getById:${id}`,
  expires: ([id], data) => new Date(data.expires),
})

const result = await cachedGetById('foo')
```

There are also helpers for setting time or manipulating dates

```typescript
import { createCache, time } from '@sebspark/promise-cache'

const cache = createCache(persistor, 'api')

type Data = {
  value: number
  lastUpdated: string // ISO6501 date time string. Data is updated every 30 minutes.
}

const getById = async (id: string): Promise<Data> => {
  // Something gets called
}

// Computed from response
const cachedGetById = cache.wrap(myApiCall, {
  key: (id) => `getById:${id}`,
  expires: ([id], data) => time.add(new Date(data.lastUpdated), { minutes: 30 })
})

// Fixed at 20 seconds
const cachedGetById = cache.wrap(myApiCall, {
  key: (id) => `getById:${id}`,
  expires: time.seconds(100),
})
```

If expiry is not set or yields an unusable value, it will default to 1 sec.
