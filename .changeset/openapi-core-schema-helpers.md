---
"@sebspark/openapi-core": patch
---

Fix several bugs in the OpenAPI schema helpers:

- `disableUnimplementedPaths` only marks operations. Before, it crashed on path items that had a `summary`, a `description` or a `$ref`.
- `flattenEnums` also flattens path-level parameters. It skips component parameters that have no `schema` instead of crashing. It only merges refs whose enums are all strings, so numeric enums no longer become `type: 'string'`.
- `resolveRef` returns `undefined` when the ref points to a value that is not an object.

The `content` map on `RequestBodyObject` and `ResponseObject` no longer requires an `application/json` entry. OpenAPI allows any set of media types, so a lookup such as `content['application/json']` is now typed as possibly `undefined`.
