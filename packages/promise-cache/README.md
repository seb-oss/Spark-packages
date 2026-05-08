# `@sebspark/promise-cache`

Simple caching wrapper for promises, backed by Redis or in-memory storage.

## **Installation**

```bash
yarn add @sebspark/promise-cache
```

## **Usage**

1. Create a persistor — use the built-in `InMemoryPersistor` or a Redis client
2. Create a cache with `createCache(persistor, 'optional-prefix')`
3. Wrap your async function with `cache.wrap(fn, options)`
4. Call the wrapped function instead of the original

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

// Fixed at today 20:00:00 UTC
const cachedGetById = cache.wrap(myApiCall, {
  key: (id) => `getById:${id}`,
  expires: time.today(20),
})

// Fixed at tomorrow 00:00:00
const cachedGetById = cache.wrap(myApiCall, {
  key: (id) => `getById:${id}`,
  expires: time.tomorrow(),
})
```

If expiry is not set or yields an unusable value, it will default to 1 sec.
