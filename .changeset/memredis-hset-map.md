---
"@sebspark/memredis": patch
---

`hSet(key, map)` now stores every entry of a `Map`, the same way Redis does. Previously it silently stored nothing. `hSet` and `ttl` no longer use type assertions.
