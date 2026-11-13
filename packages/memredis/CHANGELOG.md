# @sebspark/memredis

## 1.0.10

### Patch Changes

- 1cd213e: Updated dependencies

## 1.0.9

### Patch Changes

- 176ea40: `hSet(key, map)` now stores every entry of a `Map`, the same way Redis does. Previously it silently stored nothing. `hSet` and `ttl` no longer use type assertions.

## 1.0.8

### Patch Changes

- 7db408f: feat(opensearch): type `aggs`/`aggregations` in `SearchRequestBody<T>` against the index mapping. Restores `field` and `script` on `max`, `min`, `sum`, `avg`, `value_count`, `cardinality` and `terms`, which `@opensearch-project/opensearch` 3.9.0 dropped (opensearch-project/opensearch-js#1154). `field` on these and on `date_histogram`, `date_range` and `range` autocompletes paths from the mapping and accepts any other field name. `filter` takes an index-aware query, `top_hits` gets index-aware `sort`/`_source`, and sub-aggregations are typed recursively. Other aggregations keep their upstream types. `AggregationContainer<T>` is exported for typing individual aggregations.

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

## 1.0.7

### Patch Changes

- ad1e80f: Updated dependencies

## 1.0.6

### Patch Changes

- 9f44fbd: Updated dependencies

## 1.0.5

### Patch Changes

- 66ac832: * Upgraded to TypeScript 7
  - Replaced tsup with tsdown for package builds
  - Fixed cli-tester stdout parsing, resolving flaky e2e tests across the repo
  - Patched vulnerable transitive dependencies (uuid, socket.io-parser, and others)

## 1.0.4

### Patch Changes

- eefb531: Updated dependencies

## 1.0.3

### Patch Changes

- 5e9fc45: Bump dependencies. Security fixes:

  - **form-data** 2.5.6 / 4.0.6 — CRLF injection via unescaped multipart field names and filenames (High)
  - **vite** 8.1.2 — `server.fs.deny` bypass on Windows alternate paths; NTLMv2 hash disclosure via launch-editor (High/Moderate)
  - **ws** 8.21.0 — Memory exhaustion DoS from tiny fragments; uninitialized memory disclosure (High/Moderate)
  - **undici** 8.5.0 — Multiple DoS and information disclosure CVEs (High/Moderate/Low)
  - **tar** 7.5.19 — PAX size override causes tar parser differential / file smuggling (Moderate)
  - **qs** 6.15.3 — DoS via `qs.stringify` crash on null/undefined entries (Moderate)
  - **@opentelemetry/core** 2.8.0 — Unbounded memory allocation in W3C Baggage propagation (Moderate)
  - **@babel/core** 7.29.7 — Arbitrary file read via sourceMappingURL comment (Low)
  - **protobufjs** 8.6.5

  Other dependency updates:

  - `@google-cloud/spanner` 8.8.0
  - `@testcontainers/*` 12.0.4
  - `google-auth-library` 10.9.0
  - `mockserver-client` 7.3.0
  - `nock` 14.0.16
  - `prettier` 3.9.4
  - `redis` 6.1.0
  - `webpack` 5.108.3 / `webpack-cli` 7.1.0

## 1.0.2

### Patch Changes

- e0eda57: Updated dependencies

## 1.0.1

### Patch Changes

- 26d55f0: Fix `@sebspark/memredis` so Redis clients are assignable to `IPersistor` by widening the pub/sub subscription return types to accept both MemRedis and node-redis implementations.

  Also update supporting dependencies across the affected packages.

## 1.0.0

### Major Changes

- 0fad123: Initial stable release of `@sebspark/memredis` and `@sebspark/idempotency`.

  `@sebspark/memredis`: in-memory Redis-compatible persistor with full pub/sub support.

  `@sebspark/idempotency`: idempotency guard backed by Redis pub/sub, with `end`-callback API and `AbortSignal` for concurrent conflict detection.

  `@sebspark/promise-cache`: update README to reference `MemRedis` directly; `InMemoryPersistor` re-export retained for backwards compatibility.
