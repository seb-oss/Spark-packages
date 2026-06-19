# @sebspark/memredis

## 1.0.2

### Patch Changes

- e0eda57: Updated dependencies

## 1.0.1

### Patch Changes

- 26d55f0: Fix `@sebspark/memredis` so Redis clients are assignable to `IPersistor` by widening the pub/sub subscription return types to accept both MemRedis and node-redis implementations.

  Also update supporting dependencies across the affected packages.

## 1.0.0

### Major Changes

- 0fad123: Initial stable release of `@sebspark/memredis` and `@sebspark/idempotency`.

  `@sebspark/memredis`: in-memory Redis-compatible persistor with full pub/sub support.

  `@sebspark/idempotency`: idempotency guard backed by Redis pub/sub, with `end`-callback API and `AbortSignal` for concurrent conflict detection.

  `@sebspark/promise-cache`: update README to reference `MemRedis` directly; `InMemoryPersistor` re-export retained for backwards compatibility.
