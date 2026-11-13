# @sebspark/tsconfig

## 3.0.31

### Patch Changes

- 1cd213e: Updated dependencies

## 3.0.30

### Patch Changes

- 1804ff2: chore(deps): bump tsdown from 0.23.4 to 0.23.5

## 3.0.29

### Patch Changes

- 612967b: `base.json` now excludes the extending project's own `dist`, `build` and `node_modules` via `${configDir}`. Before, `exclude` resolved relative to `@sebspark/tsconfig` itself, so `tsc --noEmit` included the project's own build output. Typecheck running in parallel with a build could then fail intermittently with TS6053. The `**/*.spec.ts` entry, which also never matched, is removed so spec files stay typechecked.

## 3.0.28

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

## 3.0.27

### Patch Changes

- 612cebb: Add shebang to `spark-build` so it runs outside of yarn

## 3.0.26

### Patch Changes

- ad1e80f: Updated dependencies

## 3.0.25

### Patch Changes

- 66ac832: * Upgraded to TypeScript 7
  - Replaced tsup with tsdown for package builds
  - Fixed cli-tester stdout parsing, resolving flaky e2e tests across the repo
  - Patched vulnerable transitive dependencies (uuid, socket.io-parser, and others)

## 3.0.24

### Patch Changes

- d57b386: Release the tsdown update for TypeScript 7 declaration builds.

## 3.0.23

### Patch Changes

- eefb531: Updated dependencies

## 3.0.22

### Patch Changes

- e0eda57: Updated dependencies

## 3.0.21

### Patch Changes

- 97fe7da: Updated dependencies

## 3.0.20

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

## 3.0.19

### Patch Changes

- 41bb8f2: ### `@sebspark/openapi-core`

  `fromAxiosError` no longer references the `AxiosError` type in its signature. It now accepts `unknown` and uses a local duck-typed interface to extract the relevant fields. This removes the `axios` import from the published `dist/index.d.mts`, preventing downstream bundlers (rolldown/tsdown) from treating `AxiosError` as a missing value export.

  ### `@sebspark/tsconfig`

  Added `verbatimModuleSyntax: true` to `base.json`. All packages in the monorepo now emit `import type` modifiers correctly and TypeScript enforces type-only imports at typecheck time.

  ### `@sebspark/openapi-client`

  Updated `fromAxiosError` call site to pass `error` directly as `unknown` instead of casting to `AxiosError`.

  ### Other packages

  Dependency updates.

## 3.0.18

### Patch Changes

- a62ddaa: Updated vulnerable dependencies

## 3.0.17

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 3.0.16

### Patch Changes

- e9a7a28: Updated dependencies

## 3.0.15

### Patch Changes

- 4e12590: Updated dependencies

## 3.0.14

### Patch Changes

- 91aed80: Updated dependencies

## 3.0.13

### Patch Changes

- 574264d: Updated dependencies

## 3.0.12

### Patch Changes

- 6d72f97: Updated dependencies

## 3.0.11

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 3.0.10

### Patch Changes

- ed8453b: Updated dependencies

## 3.0.9

### Patch Changes

- 2241dc7: Updated dependencies

## 3.0.8

### Patch Changes

- 80e6230: Updated dependencies

## 3.0.7

### Patch Changes

- 513bf74: Suppress errors from bundling dependencies

## 3.0.6

### Patch Changes

- 11a11ce: Updated dependencies

## 3.0.4

### Patch Changes

- 48ab717: Updated dependencies

## 3.0.3

### Patch Changes

- b40eb86: Updated dependencies

## 3.0.2

### Patch Changes

- 38b52c4: Updated tsdown

## 3.0.1

### Patch Changes

- ad5a205: Updated tsdown

## 3.0.0

### Major Changes

- cc28876: Updated tsdown to v0.17

## 2.1.6

### Patch Changes

- 26c1ad7: chore: fix spark-build

## 2.1.5

### Patch Changes

- 66925c5: chore: expose tsdown as spark-build

## 2.1.4

### Patch Changes

- cacbaf5: chore: upgrade dependencies

## 2.1.3

### Patch Changes

- 37ab2b5: fix(tsconfig): export typo

## 2.1.2

### Patch Changes

- 133c172: fix: export ./tsdown

## 2.1.1

### Patch Changes

- 7846ecc: feat: add tsdown config

## 2.1.0

### Minor Changes

- 4b210c2: Standardized on a common build script

## 2.0.0

### Major Changes

- 0bd138b: ### What
  Switched all base configurations to split app and library targets:
  - `/tsconfig.app.json` for apps
  - `/tsconfig.lib.json` for libraries

  ### Why

  To align with modern TypeScript defaults and simplify Node 22 + bundler builds.

  ### How to migrate
  - **Apps:** extend `@sebspark/tsconfig/app.json` to use
    `"moduleResolution": "NodeNext"`, `"module": "NodeNext"`.
  - **Libraries:** extend `@sebspark/tsconfig/lib.json` to use
    `"moduleResolution": "Bundler"`, `"module": "ESNext"`.

## 1.0.1

### Patch Changes

- 604c94a: Updated dependencies

## 1.0.0

### Major Changes

- 142e991: target set to ES2022

## 0.1.1

### Patch Changes

- 93a37b3: Patch dependencies

## 0.1.0

### Minor Changes

- 13148cc: Publish TypeScript configuration
