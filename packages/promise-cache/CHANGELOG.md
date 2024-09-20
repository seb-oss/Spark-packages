# @sebspark/promise-cache

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
