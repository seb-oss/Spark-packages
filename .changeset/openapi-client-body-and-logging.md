---
"@sebspark/openapi-client": patch
---

- Array request bodies are now sent as JSON arrays. Previously they were merged into an object with index keys (`{ "0": ..., "1": ... }`).
- Non-`Error` values thrown by `authorizationTokenGenerator`, `authorizationTokenRefresh` or the GraphQL health check are now logged as `Error`s, so their message is kept.
- `axios-auth-refresh` is imported through its named export instead of a default-export interop workaround.
- Internal type assertions were removed.
