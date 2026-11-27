---
"@sebspark/redis-live": minor
---

First release: a local, in-memory map in every process, backed by Redis and eventually consistent through publish/subscribe. `get` and `has` are synchronous; `set` and `del` change memory at once and write to Redis in the background. Supports expiration, and emits `add`, `update`, `delete`, `expired`, `change` and `error` events.
