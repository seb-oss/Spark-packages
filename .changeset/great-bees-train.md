---
"@sebspark/promise-cache": patch
---

Fixed error where persistor could set ttl to float. Also added reuse of redis client for same settings.
