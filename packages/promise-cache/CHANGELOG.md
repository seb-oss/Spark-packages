# @sebspark/promise-cache

## 4.0.0

### Major Changes

- e70a51d: Updated redis dependency to v5

## 3.10.1

### Patch Changes

- 744b05f: Updated dependencies

## 3.10.0

### Minor Changes

- daaca84: enable fallback to wrapped function in promiseCache on cache retrieval failure

## 3.9.1

### Patch Changes

- 06948d0: Updated dependencies

## 3.9.0

### Minor Changes

- 14bf5a6: New cache wrapper now ensures persistor is connected

## 3.8.0

### Minor Changes

- 72d7c2d: deserialize is now usable with null values (will return null)

## 3.7.0

### Minor Changes

- 6936f21: Added support for setEx, pSetEx, setNX, exists, incr/decr, hSet/hGet, lPush/rPush, sAdd/sRem, zAdd/zRem and multi to IPersistor

## 3.6.0

### Minor Changes

- da3931e: Exposing serializer

## 3.5.0

### Minor Changes

- 8c2661a: Added sub, today and tomorrow to time

## 3.4.0

### Minor Changes

- 142e991: New implementation Cache

## 3.3.3

### Patch Changes

- 7e1c4d0: fix issue where ttl was being converted to ms twice

## 3.3.2

### Patch Changes

- 47838b1: allow passing pingInterval as a redis option

## 3.3.1

### Patch Changes

- 817cee6: fix, add redis object to redis create client setup

## 3.3.0

### Minor Changes

- 9c694f4: Fix promise cache with authentication

## 3.2.0

### Minor Changes

- eb01a28: ESM fix for superjson

## 3.1.0

### Minor Changes

- 88bb2f2: Uses superjson for serialization/dezerialisation

## 3.0.1

### Patch Changes

- 9138c3b: Log errors in persistor
- 4e51747: Use logger in persistor

## 3.0.0

### Major Changes

- 8466c95: - TTL is always seconds.
  Support logger injection.
  Handle complex types; set, map, object, array.

## 2.1.2

### Patch Changes

- 3796c8e: stop logging redis keys as they might have sensitive information.

## 2.1.1

### Patch Changes

- df6468d: ttl in response should be in seconds

## 2.1.0

### Minor Changes

- 6d40aae: enable setting cache ttl from promise response

## 2.0.10

### Patch Changes

- cccc089: Error in GCP Redis MemoryStore, doesnt support SETNAME command

## 2.0.9

### Patch Changes

- 85f095f: Wait until the connection is ready

## 2.0.8

### Patch Changes

- f145e39: Remove max 5 tries

## 2.0.7

### Patch Changes

- f3ed352: Change retry timeoute

## 2.0.6

### Patch Changes

- f7dd4c1: Remove retry library and use default retry system from redis

## 2.0.5

### Patch Changes

- 9342770: Use redis event ready instead connect to start storing data

## 2.0.4

### Patch Changes

- 3e9f97f: Fix: Return a promise to avoid errors in the retry function

## 2.0.3

### Patch Changes

- 5cfb14a: Change redis connection reuse logic

## 2.0.2

### Patch Changes

- e21f808: Add connection flag to persistor

## 2.0.1

### Patch Changes

- 0da73eb: Show in logs which client is trying to connect to redis

## 2.0.0

### Major Changes

- bfcf244: Add a name to the redis connection, then the PromiseCache class will get the current persistor with that connection name avoiding duplicates

## 1.4.0

### Minor Changes

- f4ed2a1: Use retry from "@sebspark/retry" when try to connect to redis

## 1.3.1

### Patch Changes

- 93a37b3: Patch dependencies

## 1.3.0

### Minor Changes

- 9ca6fe1: Exporting PromiseCacheOptions and RedisClientOptions types

## 1.2.4

### Patch Changes

- 11554bb: Use LocalMemory instead redis if is a test

## 1.2.3

### Patch Changes

- adb4404: Add default error log

## 1.2.2

### Patch Changes

- 1fa4f6e: Fixed error in persistor cache

## 1.2.1

### Patch Changes

- 95b26d7: Fixed error where persistor could set ttl to float. Also added reuse of redis client for same settings.

## 1.2.0

### Minor Changes

- 4437b67: redis config is now RedisClientOptions

## 1.1.0

### Minor Changes

- 57b11f4: Exposing the Persistor

## 1.0.0

### Major Changes

- 687a412: Allow connecting to Redis that is setup with either AUTH enabled or disabled by changing to a redis object as an optional argument

## 0.2.9

### Patch Changes

- 37c70c7: Change constructor promiseCache

## 0.2.8

### Patch Changes

- 47d6f2e: optional REDIS_PASSWORD as environment variable

## 0.2.7

### Patch Changes

- ddd44a9: Change console.logs with callbacks

## 0.2.6

### Patch Changes

- 204b80b: Singleton to share memory between instances

## 0.2.5

### Patch Changes

- 38d00b1: Set redis version to 4.6.12

## 0.2.4

### Patch Changes

- 415966e: Set redis version to 4.6.12

## 0.2.4

### Patch Changes

- d7b4beb: New option to use local memory instead redis

## 0.2.3

### Patch Changes

- 9f673e8: Export mocked redis to use externally, add new function to find items in cache

## 0.2.2

### Patch Changes

- ede4a4f: Add override function to promiseCache

## 0.2.1

### Patch Changes

- 5ffc4a5: Bump promise-cache library to 0.2.1

## 0.2.0

### Minor Changes

- f5d0748: - Support optional TTL in each call to wrap(...)
  - Support optional case sensitivity

## 0.1.0

### Minor Changes

- 547aab6: First version of promise-cache. A simple caching wrapper for promises.
