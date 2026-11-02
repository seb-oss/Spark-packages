---
"@sebspark/openapi-core": patch
---

Fixed the client argument types:

- `RequestArgs` no longer includes Express `Request`. These are the arguments a client passes to `BaseClient` methods, built as plain objects, so calls such as `client.post(url, { body, headers })` now type-check without casts. Server handlers keep their own `Req & { ... }` types.
- `PayloadRequestArgs.body` is now `unknown` instead of `Record<string, string>`. The client sends any JSON body, including numbers, nested objects and arrays.
