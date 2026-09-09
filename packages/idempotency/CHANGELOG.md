# @sebspark/idempotency

## 1.0.1

### Patch Changes

- 66ac832: * Upgraded to TypeScript 7
  - Replaced tsup with tsdown for package builds
  - Fixed cli-tester stdout parsing, resolving flaky e2e tests across the repo
  - Patched vulnerable transitive dependencies (uuid, socket.io-parser, and others)

## 1.0.0

### Major Changes

- 0fad123: Initial stable release of `@sebspark/memredis` and `@sebspark/idempotency`.

  `@sebspark/memredis`: in-memory Redis-compatible persistor with full pub/sub support.

  `@sebspark/idempotency`: idempotency guard backed by Redis pub/sub, with `end`-callback API and `AbortSignal` for concurrent conflict detection.

  `@sebspark/promise-cache`: update README to reference `MemRedis` directly; `InMemoryPersistor` re-export retained for backwards compatibility.
