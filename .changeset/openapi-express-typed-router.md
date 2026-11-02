---
"@sebspark/openapi-express": patch
---

`TypedRouter` no longer uses type assertions. It registers routes per HTTP verb, reads `headers` only from responses that have them, and checks that `statusCode` on thrown errors is a number before recording it on the span. Its behaviour is otherwise unchanged. The package's unit tests run again, after `vitest` was restored as a dev dependency.
