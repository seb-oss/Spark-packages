---
"@sebspark/opensearch": patch
---

Fix `term`, `prefix`, `regexp`, `wildcard`, `span_term`, and `terms_set` query types, which were uninhabitable (`value` resolved to `never`) and required a redundant, incorrect inner `field` key. These queries now accept the correct OpenSearch wire format, e.g. `{ term: { age: 30 } }`, matching the existing `match`/`terms` convention.
