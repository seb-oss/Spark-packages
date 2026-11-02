# @sebspark/socket.io-gcp-pubsub-emitter

## 1.0.33

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

## 1.0.32

### Patch Changes

- ad1e80f: Updated dependencies

## 1.0.31

### Patch Changes

- 9f44fbd: Updated dependencies

## 1.0.30

### Patch Changes

- 66ac832: * Upgraded to TypeScript 7
  - Replaced tsup with tsdown for package builds
  - Fixed cli-tester stdout parsing, resolving flaky e2e tests across the repo
  - Patched vulnerable transitive dependencies (uuid, socket.io-parser, and others)

## 1.0.29

### Patch Changes

- eefb531: Updated dependencies

## 1.0.28

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

## 1.0.27

### Patch Changes

- 3111112: Openapi client args are now PartiallySerialized

  Also: dependency updates

## 1.0.26

### Patch Changes

- e0eda57: Updated dependencies

## 1.0.25

### Patch Changes

- 26d55f0: Fix `@sebspark/memredis` so Redis clients are assignable to `IPersistor` by widening the pub/sub subscription return types to accept both MemRedis and node-redis implementations.

  Also update supporting dependencies across the affected packages.

## 1.0.24

### Patch Changes

- a6c27f3: Updated dependencies

## 1.0.23

### Patch Changes

- 97fe7da: Updated dependencies

## 1.0.22

### Patch Changes

- 264e665: Upgrade `redis` to v6 in `@sebspark/promise-cache` and bump minor dependencies across the workspace.

  **Breaking change (`@sebspark/promise-cache`):**
  `redis` upgraded from `5.12.1` → `6.0.0`. Redis v6 contains breaking changes in its API — see the [redis v6 migration guide](https://github.com/redis/node-redis/blob/master/docs/v4-to-v6.md) if your code uses the client directly.

  **Dependency updates across packages:**
  - `testcontainers` / `@testcontainers/*`: `12.0.0` → `12.0.1` (health-check, opensearch, opentelemetry-instrumentation-opensearch, otel, promise-cache, socket.io-gcp-pubsub-emitter, spanner-migrate, test-iap)
  - `redis`: `5.12.1` → `6.0.0` (otel, promise-cache)
  - `tsdown`: `0.22.0` → `0.22.1` (tsconfig)
  - `turbo` / `@turbo/gen`: `2.9.15` → `2.9.16`
  - `webpack-cli`: `7.0.2` → `7.0.3` (avsc-isometric)

  **Test fix (`@sebspark/promise-cache`):**
  Pinned Redis container image tag to `redis:8.8-alpine` (was `redis:8-alpine`) to prevent floating-tag drift in e2e tests.

## 1.0.21

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

## 1.0.20

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.

## 1.0.19

### Patch Changes

- 41bb8f2: ### `@sebspark/openapi-core`

  `fromAxiosError` no longer references the `AxiosError` type in its signature. It now accepts `unknown` and uses a local duck-typed interface to extract the relevant fields. This removes the `axios` import from the published `dist/index.d.mts`, preventing downstream bundlers (rolldown/tsdown) from treating `AxiosError` as a missing value export.

  ### `@sebspark/tsconfig`

  Added `verbatimModuleSyntax: true` to `base.json`. All packages in the monorepo now emit `import type` modifiers correctly and TypeScript enforces type-only imports at typecheck time.

  ### `@sebspark/openapi-client`

  Updated `fromAxiosError` call site to pass `error` directly as `unknown` instead of casting to `AxiosError`.

  ### Other packages

  Dependency updates.

## 1.0.18

### Patch Changes

- a62ddaa: Updated vulnerable dependencies

## 1.0.17

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 1.0.16

### Patch Changes

- 4e12590: Updated dependencies

## 1.0.15

### Patch Changes

- 6d72f97: Updated dependencies

## 1.0.14

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 1.0.13

### Patch Changes

- 112a381: Updated dependencies

## 1.0.12

### Patch Changes

- 35ec1a0: Updated dependencies

## 1.0.11

### Patch Changes

- c8dcadb: Updated dependencies

## 1.0.10

### Patch Changes

- 11a11ce: Updated dependencies

## 1.0.8

### Patch Changes

- 48ab717: Updated dependencies

## 1.0.7

### Patch Changes

- 87c769d: Updated dependencies

## 1.0.6

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

## 1.0.5

### Patch Changes

- 8626deb: Updated vulnerable, transitive jws dependency

## 1.0.4

### Patch Changes

- 7df8217: Updated dependencies

## 1.0.3

### Patch Changes

- 4b210c2: Standardized on a common build script

## 1.0.2

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler

## 1.0.1

### Patch Changes

- d801e1e: Updated dependencies and fixed some exports

## 1.0.0

### Major Changes

- 0864ec2: ESM only. Minimum node version 22

## 0.1.5

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 0.1.4

### Patch Changes

- 604c94a: Updated dependencies

## 0.1.3

### Patch Changes

- 29b9b20: Updated dependencies

## 0.1.2

### Patch Changes

- 5c6e183: Updated dependencies

## 0.1.1

### Patch Changes

- d8dcd5d: Updates google-cloud/pubsub to match all between all the packages

## 0.1.0

### Minor Changes

- 05d2535: First version of socket.io PubSub emitter
