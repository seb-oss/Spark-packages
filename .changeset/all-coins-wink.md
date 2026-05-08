---
"@sebspark/promise-cache": minor
---

`IPersistor` and `IPersistorMulti` now expose two new capabilities:

- **`keys(pattern)`** — returns all keys matching a Redis glob pattern (`*`, `?`). `InMemoryPersistor` converts the glob to a regex for consistent behaviour.
- **`del(key | key[])`** — `del` now accepts either a single key or an array of keys, mirroring Redis's variadic `DEL` command. Returns the count of deleted keys.
