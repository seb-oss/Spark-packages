# @sebspark/promise-cache

## 8.1.1

### Patch Changes

- a6c27f3: Updated dependencies
- Updated dependencies [a6c27f3]
  - @sebspark/otel@4.1.11

## 8.1.0

### Minor Changes

- 0fad123: Initial stable release of `@sebspark/memredis` and `@sebspark/idempotency`.

  `@sebspark/memredis`: in-memory Redis-compatible persistor with full pub/sub support.

  `@sebspark/idempotency`: idempotency guard backed by Redis pub/sub, with `end`-callback API and `AbortSignal` for concurrent conflict detection.

  `@sebspark/promise-cache`: update README to reference `MemRedis` directly; `InMemoryPersistor` re-export retained for backwards compatibility.

### Patch Changes

- Updated dependencies [0fad123]
  - @sebspark/memredis@1.0.0

## 8.0.2

### Patch Changes

- Updated dependencies [97fe7da]
  - @sebspark/otel@4.1.10

## 8.0.1

### Patch Changes

- 494f9b3: Updated dependencies

## 8.0.0

### Major Changes

- 264e665: Upgrade `redis` to v6 in `@sebspark/promise-cache` and bump minor dependencies across the workspace.

  **Breaking change (`@sebspark/promise-cache`):**
  `redis` upgraded from `5.12.1` → `6.0.0`. Redis v6 contains breaking changes in its API — see the [redis v6 migration guide](https://github.com/redis/node-redis/blob/master/docs/v4-to-v6.md) if your code uses the client directly.

  **Dependency updates across packages:**
  - `testcontainers` / `@testcontainers/*`: `12.0.0` → `12.0.1` (health-check, opensearch, opentelemetry-instrumentation-opensearch, otel, promise-cache, socket.io-gcp-pubsub-emitter, spanner-migrate, test-iap)
  - `redis`: `5.12.1` → `6.0.0` (otel, promise-cache)
  - `tsdown`: `0.22.0` → `0.22.1` (tsconfig)
  - `turbo` / `@turbo/gen`: `2.9.15` → `2.9.16`
  - `webpack-cli`: `7.0.2` → `7.0.3` (avsc-isometric)

  **Test fix (`@sebspark/promise-cache`):**
  Pinned Redis container image tag to `redis:8.8-alpine` (was `redis:8-alpine`) to prevent floating-tag drift in e2e tests.

### Patch Changes

- Updated dependencies [264e665]
  - @sebspark/otel@4.1.9

## 7.0.4

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

- Updated dependencies [242eb33]
  - @sebspark/otel@4.1.8

## 7.0.3

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.
- Updated dependencies [c5e9c99]
  - @sebspark/otel@4.1.7

## 7.0.2

### Patch Changes

- Updated dependencies [41bb8f2]
  - @sebspark/otel@4.1.6

## 7.0.1

### Patch Changes

- Updated dependencies [a62ddaa]
  - @sebspark/otel@4.1.5

## 7.0.0

### Major Changes

- 55e3708: Removed the deprecated `PromiseCache` class and `Persistor` class.

  **Breaking changes:**
  - `PromiseCache` is removed. Use `createCache(persistor, prefix)` with a Redis client or `InMemoryPersistor` instead.
  - `Persistor` is removed. Pass a Redis client directly to `createCache`, or use `InMemoryPersistor` for in-memory storage.
    The `createCache` / `InMemoryPersistor` / `serializer` / `time` API is unchanged.

## 6.6.0

### Minor Changes

- 5ed6ece: `IPersistor` and `IPersistorMulti` now expose two new capabilities:
  - **`keys(pattern)`** — returns all keys matching a Redis glob pattern (`*`, `?`). `InMemoryPersistor` converts the glob to a regex for consistent behaviour.
  - **`del(key | key[])`** — `del` now accepts either a single key or an array of keys, mirroring Redis's variadic `DEL` command. Returns the count of deleted keys.

## 6.5.0

### Minor Changes

- 2cff3d4: IPersistor and InMemoryPersistor now support keys()

## 6.4.29

### Patch Changes

- Updated dependencies [cf4ca8e]
  - @sebspark/otel@4.1.4

## 6.4.28

### Patch Changes

- 7d8cc98: Dependabot dependency updates
- Updated dependencies [7d8cc98]
  - @sebspark/otel@4.1.3

## 6.4.27

### Patch Changes

- Updated dependencies [8a120f6]
  - @sebspark/otel@4.1.2

## 6.4.26

### Patch Changes

- 764bac9: Fix instanceof for HttpError subclasses

  Fix ANSI color detection in cli-tester input: `styleText('red', '> ')` includes the closing escape code immediately after the space, so it never matched Inquirer's output where the full message is wrapped in red. Detection now extracts only the opening ANSI code using a NUL probe. Also fixes green tick detection with the same approach. Tests added for both no-color and ANSI color modes.

  Fix promise-cache to treat persistor errors as a cache miss rather than propagating them to the caller. Both `get` and `set` failures are now silently swallowed so the cache is always a pure performance optimisation.

  Fix duplicate `makeType` helper in socket.io-avro parser spec (hoisted to module scope). Fix negated ternary and unused import in the same file.

## 6.4.25

### Patch Changes

- Updated dependencies [e9a7a28]
  - @sebspark/otel@4.1.1

## 6.4.24

### Patch Changes

- Updated dependencies [7494311]
  - @sebspark/otel@4.1.0

## 6.4.23

### Patch Changes

- 6399280: Health check now has ddos protection. Type fix in promise-cache.

## 6.4.22

### Patch Changes

- 4e12590: Updated dependencies
- Updated dependencies [4124516]
- Updated dependencies [4e12590]
  - @sebspark/otel@4.0.1

## 6.4.21

### Patch Changes

- Updated dependencies [f07a679]
  - @sebspark/otel@4.0.0

## 6.4.20

### Patch Changes

- Updated dependencies [aff5f58]
  - @sebspark/otel@3.0.4

## 6.4.19

### Patch Changes

- Updated dependencies [ae4b9bf]
  - @sebspark/otel@3.0.3

## 6.4.18

### Patch Changes

- @sebspark/otel@3.0.2

## 6.4.17

### Patch Changes

- Updated dependencies [22bde73]
  - @sebspark/otel@3.0.1

## 6.4.16

### Patch Changes

- 91aed80: Updated dependencies
- Updated dependencies [91aed80]
  - @sebspark/otel@3.0.0

## 6.4.15

### Patch Changes

- @sebspark/otel@2.2.3

## 6.4.14

### Patch Changes

- @sebspark/otel@2.2.2

## 6.4.13

### Patch Changes

- @sebspark/otel@2.2.1

## 6.4.12

### Patch Changes

- Updated dependencies [3d2415a]
  - @sebspark/otel@2.2.0

## 6.4.11

### Patch Changes

- 67871de: Otel now warns on stdout. Also dependency updates.
- Updated dependencies [67871de]
  - @sebspark/otel@2.1.8

## 6.4.10

### Patch Changes

- 6d72f97: Updated dependencies

## 6.4.9

### Patch Changes

- 736a0b3: No bundling of packages in packages
- Updated dependencies [736a0b3]
  - @sebspark/otel@2.1.7

## 6.4.8

### Patch Changes

- Updated dependencies [5e9294e]
  - @sebspark/otel@2.1.6

## 6.4.7

### Patch Changes

- Updated dependencies [23be838]
  - @sebspark/otel@2.1.5

## 6.4.6

### Patch Changes

- Updated dependencies [6cf0475]
  - @sebspark/otel@2.1.4

## 6.4.5

### Patch Changes

- Updated dependencies [8cd0201]
  - @sebspark/otel@2.1.3

## 6.4.4

### Patch Changes

- Updated dependencies [1c13543]
  - @sebspark/otel@2.1.2

## 6.4.3

### Patch Changes

- Updated dependencies [1485c2d]
  - @sebspark/otel@2.1.1

## 6.4.2

### Patch Changes

- Updated dependencies [c60b7a4]
  - @sebspark/otel@2.1.0

## 6.4.1

### Patch Changes

- Updated dependencies [2241dc7]
  - @sebspark/otel@2.0.14

## 6.4.0

### Minor Changes

- 1b2829b: Added hDel to IPersistor

## 6.3.2

### Patch Changes

- Updated dependencies [80e6230]
  - @sebspark/otel@2.0.13

## 6.3.1

### Patch Changes

- a005bef: Export all exposed types

## 6.3.0

### Minor Changes

- 064312c: Added zAdd, zIncrBy, zRange, zRangeWithScores, zScore, zRank, zCount, zRangeByScore, zRangeByScoreWithScores, zRem

## 6.2.7

### Patch Changes

- 35ec1a0: Updated dependencies

## 6.2.6

### Patch Changes

- c8dcadb: Updated dependencies
- Updated dependencies [c8dcadb]
  - @sebspark/otel@2.0.12

## 6.2.5

### Patch Changes

- Updated dependencies [11a11ce]
  - @sebspark/otel@2.0.11

## 6.2.3

### Patch Changes

- 48ab717: Updated dependencies
- Updated dependencies [48ab717]
  - @sebspark/otel@2.0.9

## 6.2.2

### Patch Changes

- b40eb86: Updated dependencies

## 6.2.1

### Patch Changes

- 87c769d: Updated dependencies

## 6.2.0

### Minor Changes

- ebddd25: Added support for hGetAll to IPersistor / InMemoryPersistor

## 6.1.3

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown
- Updated dependencies [e0cb5ee]
  - @sebspark/otel@2.0.8

## 6.1.2

### Patch Changes

- 7df8217: Updated dependencies
- Updated dependencies [7df8217]
  - @sebspark/otel@2.0.6

## 6.1.1

### Patch Changes

- 8f727a4: Persistor now takes a redis client instance as optional parameter.

## 6.1.0

### Minor Changes

- cacbaf5: chore: upgrade dependencies

## 6.0.3

### Patch Changes

- 4b210c2: Standardized on a common build script
- Updated dependencies [4b210c2]
  - @sebspark/otel@2.0.5

## 6.0.2

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler
- Updated dependencies [7e5c2e9]
  - @sebspark/otel@2.0.2

## 6.0.1

### Patch Changes

- d801e1e: Updated dependencies and fixed some exports
- Updated dependencies [d801e1e]
  - @sebspark/otel@2.0.1

## 6.0.0

### Major Changes

- 0864ec2: ESM only. Minimum node version 22

### Patch Changes

- Updated dependencies [0864ec2]
  - @sebspark/otel@2.0.0

## 5.0.2

### Patch Changes

- 99cc4b9: ESM import of superjson in Persistor

## 5.0.1

### Patch Changes

- 3a40e49: Cleaned up dependencies
- Updated dependencies [3a40e49]
  - @sebspark/otel@1.1.4

## 5.0.0

### Major Changes

- 604c94a: All logging is done through @sepspark/otel

### Patch Changes

- Updated dependencies [604c94a]
  - @sebspark/otel@1.1.3

## 4.0.3

### Patch Changes

- 29b9b20: Updated dependencies

## 4.0.2

### Patch Changes

- 5c6e183: Updated dependencies

## 4.0.1

### Patch Changes

- 9b3f745: Don't allow negative values when setting expire times in redis.

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
