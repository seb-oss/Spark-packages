# @sebspark/cli-tester

## 1.0.23

### Patch Changes

- 176ea40: `Prompt<'select'>` now resolves to `SelectPrompt | CheckboxPrompt` and `Prompt<undefined>` to the union of all prompt types, so narrowing a parsed prompt works without type assertions. The internal sleep helper was replaced with `node:timers/promises`.

## 1.0.22

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

## 1.0.21

### Patch Changes

- 9f44fbd: Updated dependencies

## 1.0.20

### Patch Changes

- 66ac832: * Upgraded to TypeScript 7
  - Replaced tsup with tsdown for package builds
  - Fixed cli-tester stdout parsing, resolving flaky e2e tests across the repo
  - Patched vulnerable transitive dependencies (uuid, socket.io-parser, and others)

## 1.0.19

### Patch Changes

- 494f9b3: Updated dependencies

## 1.0.18

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

## 1.0.17

### Patch Changes

- 41bb8f2: ### `@sebspark/openapi-core`

  `fromAxiosError` no longer references the `AxiosError` type in its signature. It now accepts `unknown` and uses a local duck-typed interface to extract the relevant fields. This removes the `axios` import from the published `dist/index.d.mts`, preventing downstream bundlers (rolldown/tsdown) from treating `AxiosError` as a missing value export.

  ### `@sebspark/tsconfig`

  Added `verbatimModuleSyntax: true` to `base.json`. All packages in the monorepo now emit `import type` modifiers correctly and TypeScript enforces type-only imports at typecheck time.

  ### `@sebspark/openapi-client`

  Updated `fromAxiosError` call site to pass `error` directly as `unknown` instead of casting to `AxiosError`.

  ### Other packages

  Dependency updates.

## 1.0.16

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 1.0.15

### Patch Changes

- 764bac9: Fix instanceof for HttpError subclasses

  Fix ANSI color detection in cli-tester input: `styleText('red', '> ')` includes the closing escape code immediately after the space, so it never matched Inquirer's output where the full message is wrapped in red. Detection now extracts only the opening ANSI code using a NUL probe. Also fixes green tick detection with the same approach. Tests added for both no-color and ANSI color modes.

  Fix promise-cache to treat persistor errors as a cache miss rather than propagating them to the caller. Both `get` and `set` failures are now silently swallowed so the cache is always a pure performance optimisation.

  Fix duplicate `makeType` helper in socket.io-avro parser spec (hoisted to module scope). Fix negated ternary and unused import in the same file.

## 1.0.14

### Patch Changes

- 4124516: Updated dependencies
- 4e12590: Updated dependencies

## 1.0.13

### Patch Changes

- f90d132: Updated dependencies

## 1.0.12

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 1.0.11

### Patch Changes

- ed8453b: Updated dependencies

## 1.0.10

### Patch Changes

- 112a381: Updated dependencies

## 1.0.9

### Patch Changes

- c8dcadb: Updated dependencies

## 1.0.7

### Patch Changes

- b40eb86: Updated dependencies

## 1.0.6

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

## 1.0.5

### Patch Changes

- cc28876: Updated dependencies

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

## 0.1.4

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 0.1.3

### Patch Changes

- 29b9b20: Updated dependencies

## 0.1.2

### Patch Changes

- 5c6e183: Updated dependencies

## 0.1.1

### Patch Changes

- 06948d0: Updated dependencies

## 0.1.0

### Minor Changes

- 58ed044: Rewrite of spanner-migrate to dupport multiple databases. Also first version of cli-tester - a tool for testing @inquirer based cli:s.
