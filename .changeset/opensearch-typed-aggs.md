---
"@sebspark/opensearch": minor
"@sebspark/cli-tester": patch
"@sebspark/memredis": patch
"@sebspark/openapi-express": patch
"@sebspark/opentelemetry-instrumentation-opensearch": patch
"@sebspark/otel": patch
"@sebspark/promise-cache": patch
"@sebspark/socket.io-gcp-pubsub-emitter": patch
"@sebspark/spanner-migrate": patch
"@sebspark/test-iap": patch
"@sebspark/tsconfig": patch
---

feat(opensearch): type `aggs`/`aggregations` in `SearchRequestBody<T>` against the index mapping. Restores `field` and `script` on `max`, `min`, `sum`, `avg`, `value_count`, `cardinality` and `terms`, which `@opensearch-project/opensearch` 3.9.0 dropped (opensearch-project/opensearch-js#1154). `field` on these and on `date_histogram`, `date_range` and `range` autocompletes paths from the mapping and accepts any other field name. `filter` takes an index-aware query, `top_hits` gets index-aware `sort`/`_source`, and sub-aggregations are typed recursively. Other aggregations keep their upstream types. `AggregationContainer<T>` is exported for typing individual aggregations.

feat(opensearch): the typing never blocks a request OpenSearch accepts. Fields that are not in the mapping (e.g. added by dynamic mapping) are accepted in `query`, `sort`, `_source`, `collapse`, `highlight`, aggregation `field`/`filter` and `top_hits` `sort`/`_source`; mapped fields still autocomplete. `DocumentFor<T>` accepts fields that are not in the mapping as `unknown`, so `index`, `bulk` and the bulk helpers take documents with extra fields. A generic `SearchRequest<T>` can be passed to the upstream `Client`.

fix(opensearch): sort accepts the direction shorthand (`{ age: 'desc' }`), `knn_vector` fields map to `number[]` in `DocumentFor`, `knn.filter` is a single query instead of an array, and `script_score.query` is required. OpenSearch rejects both an array `knn.filter` and a `script_score` without `query`, so only requests that already failed at runtime stop compiling. To migrate, combine several knn filters in one `bool` query (`filter: { bool: { filter: [...] } }`), and add `query: { match_all: {} }` to a `script_score` that had none.

chore(deps): update dependencies
- `@google-cloud/pubsub` 6.3.1 → 6.3.2
- `@inquirer/figures` 2.0.9 → 2.0.10
- `@inquirer/prompts` 8.7.4 → 8.7.5
- `@opentelemetry/semantic-conventions` 1.43.0 → 1.44.0
- `redis` 6.3.0 → 6.3.1
- `tsdown` 0.23.1 → 0.23.4

fix: dependency issues found by knip
- `@sebspark/promise-cache`: drop the unused `@sebspark/otel`
- `@sebspark/socket.io-gcp-pubsub-emitter`: drop the unused `uuid`
- `@sebspark/memredis`: derive `GetExOptions` from `redis` instead of importing the unlisted `@redis/client` internals

fix(test-iap): the default base image of `TestIapContainer` is now `node:26.13.0-alpine`, pinned by digest, instead of the floating `node:22-alpine`. Use `withBaseImage()` to choose another image.
