---
"@sebspark/openapi-core": patch
---

Restore `RequestArgs` as `Request & { params?, query?, headers? }`, as it was before 4.1.26.

In 4.1.26, `RequestArgs` became a plain object. Plain argument objects then satisfied the generic `BaseClient` methods. For generated clients typed as `Pick<BaseClient, V> & { [V]: <overloads> }`, calls whose `url` is a union of literals resolved to the generic signature, and `response.data` became `unknown`. The calls now resolve to the generated overload again.

`PayloadRequestArgs.body` stays `unknown`.
