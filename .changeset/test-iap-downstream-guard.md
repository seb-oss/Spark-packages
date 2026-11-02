---
"@sebspark/test-iap": patch
---

Introspection now fails with a clear error when `mode` is `downstream` but no downstream URL is configured, instead of calling the remote JWT endpoint with `undefined`. Non-string `Authorization` headers are rejected explicitly with `IntrospectionError`. Internal type assertions were replaced with narrowing.
