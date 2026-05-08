---
"@sebspark/promise-cache": major
---

Removed the deprecated `PromiseCache` class and `Persistor` class.

**Breaking changes:**

- `PromiseCache` is removed. Use `createCache(persistor, prefix)` with a Redis client or `InMemoryPersistor` instead.
- `Persistor` is removed. Pass a Redis client directly to `createCache`, or use `InMemoryPersistor` for in-memory storage.
The `createCache` / `InMemoryPersistor` / `serializer` / `time` API is unchanged.
