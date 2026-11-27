---
"@sebspark/pg-live": minor
---

First release: keep every row of a Postgres table in memory in each process, updated through LISTEN/NOTIFY. `writeAndNotify` writes and notifies in one transaction; `live()` hydrates once and applies each change, with `add`, `update`, `delete`, `change` and `error` events.
