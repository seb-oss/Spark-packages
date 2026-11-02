---
"@sebspark/opensearch": minor
---

Type `aggs`/`aggregations` in `SearchRequestBody<T>` against the index mapping. Restores `field` and `script` on `max`, `min`, `sum`, `avg`, `value_count`, `cardinality` and `terms`, which `@opensearch-project/opensearch` 3.9.0 dropped (opensearch-js#1154). `field` only accepts mapped paths, `filter` takes an index-aware query, `top_hits` gets index-aware `sort`/`_source`, and sub-aggregations are typed recursively.
