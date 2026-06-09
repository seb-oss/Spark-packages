---
"@sebspark/idempotency": major
"@sebspark/memredis": major
"@sebspark/promise-cache": minor
---

Initial stable release of `@sebspark/memredis` and `@sebspark/idempotency`.

`@sebspark/memredis`: in-memory Redis-compatible persistor with full pub/sub support.

`@sebspark/idempotency`: idempotency guard backed by Redis pub/sub, with `end`-callback API and `AbortSignal` for concurrent conflict detection.

`@sebspark/promise-cache`: update README to reference `MemRedis` directly; `InMemoryPersistor` re-export retained for backwards compatibility.
