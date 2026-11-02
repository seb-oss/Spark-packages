---
"@sebspark/health-check": patch
---

- Polled and async dependency checks now always report `freshness`. Before the first result it is `{ lastChecked: null, lastSuccess: null }`. Previously the field was missing, even though both the `DependencyCheck` type and the OpenAPI schema mark it as required. `Freshness.lastChecked` is now typed `string | null`, and the README schema is updated to match.
- A failed check no longer mutates the `freshness` object of a result that was already returned.
- When a dependency throws a non-`Error` value, the error is now reported with its message (for example `'connection refused'`) instead of `message: undefined`.
- Internal type assertions were removed.
