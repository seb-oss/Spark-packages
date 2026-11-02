---
"@sebspark/openapi-typegen": patch
---

Fix how the parser handles some valid and some invalid OpenAPI documents:

- An inline parameter that uses `content` instead of `schema` is now typed as `unknown`. Before, it crashed.
- A component request body without `application/json` content is now skipped. Before, it crashed.
- A property defined only by `oneOf` or `anyOf` is now typed as the union of its alternatives. Before, it became `unknown`.
- An `apiKey` security scheme without `name` now throws a clear error. Before, it generated a header called `undefined`.

References are now detected with a type guard instead of type casts. The generated code is otherwise unchanged.
