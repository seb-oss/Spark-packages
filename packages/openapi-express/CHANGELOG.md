# @sebspark/openapi-express

## 5.4.27

### Patch Changes

- Updated dependencies [bb2a3d5]
  - @sebspark/otel@4.3.2

## 5.4.26

### Patch Changes

- Updated dependencies [75d5a5b]
  - @sebspark/otel@4.3.1

## 5.4.25

### Patch Changes

- Updated dependencies [5091491]
  - @sebspark/otel@4.3.0

## 5.4.24

### Patch Changes

- Updated dependencies [907ebc8]
  - @sebspark/openapi-core@4.1.27

## 5.4.23

### Patch Changes

- 176ea40: `TypedRouter` no longer uses type assertions. It registers routes per HTTP verb, reads `headers` only from responses that have them, and checks that `statusCode` on thrown errors is a number before recording it on the span. Its behaviour is otherwise unchanged. The package's unit tests run again, after `vitest` was restored as a dev dependency.
- Updated dependencies [176ea40]
- Updated dependencies [176ea40]
- Updated dependencies [176ea40]
  - @sebspark/openapi-core@4.1.26
  - @sebspark/otel@4.2.2

## 5.4.22

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

- Updated dependencies [7db408f]
  - @sebspark/otel@4.2.1

## 5.4.21

### Patch Changes

- Updated dependencies [10aba82]
  - @sebspark/openapi-core@4.1.25

## 5.4.20

### Patch Changes

- Updated dependencies [ad1e80f]
- Updated dependencies [ad1e80f]
  - @sebspark/otel@4.2.0
  - @sebspark/openapi-core@4.1.24

## 5.4.19

### Patch Changes

- Updated dependencies [9f44fbd]
  - @sebspark/openapi-core@4.1.23
  - @sebspark/otel@4.1.17

## 5.4.18

### Patch Changes

- 66ac832: * Upgraded to TypeScript 7
  - Replaced tsup with tsdown for package builds
  - Fixed cli-tester stdout parsing, resolving flaky e2e tests across the repo
  - Patched vulnerable transitive dependencies (uuid, socket.io-parser, and others)
- Updated dependencies [66ac832]
  - @sebspark/openapi-core@4.1.22
  - @sebspark/otel@4.1.16

## 5.4.17

### Patch Changes

- eefb531: Updated dependencies
- Updated dependencies [eefb531]
  - @sebspark/openapi-core@4.1.21
  - @sebspark/otel@4.1.15

## 5.4.16

### Patch Changes

- Updated dependencies [5e9fc45]
  - @sebspark/otel@4.1.14

## 5.4.15

### Patch Changes

- @sebspark/openapi-core@4.1.20

## 5.4.14

### Patch Changes

- Updated dependencies [e0eda57]
  - @sebspark/openapi-core@4.1.19
  - @sebspark/otel@4.1.13

## 5.4.13

### Patch Changes

- Updated dependencies [26d55f0]
  - @sebspark/otel@4.1.12

## 5.4.12

### Patch Changes

- Updated dependencies [a6c27f3]
  - @sebspark/otel@4.1.11

## 5.4.11

### Patch Changes

- Updated dependencies [97fe7da]
  - @sebspark/openapi-core@4.1.18
  - @sebspark/otel@4.1.10

## 5.4.10

### Patch Changes

- Updated dependencies [264e665]
  - @sebspark/otel@4.1.9

## 5.4.9

### Patch Changes

- Updated dependencies [242eb33]
  - @sebspark/otel@4.1.8

## 5.4.8

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.
- Updated dependencies [c5e9c99]
  - @sebspark/openapi-core@4.1.17
  - @sebspark/otel@4.1.7

## 5.4.7

### Patch Changes

- Updated dependencies [41bb8f2]
  - @sebspark/openapi-core@4.1.16
  - @sebspark/otel@4.1.6

## 5.4.6

### Patch Changes

- Updated dependencies [a62ddaa]
  - @sebspark/otel@4.1.5

## 5.4.5

### Patch Changes

- Updated dependencies [cf4ca8e]
  - @sebspark/otel@4.1.4

## 5.4.4

### Patch Changes

- 7d8cc98: Dependabot dependency updates
- Updated dependencies [7d8cc98]
  - @sebspark/openapi-core@4.1.15
  - @sebspark/otel@4.1.3

## 5.4.3

### Patch Changes

- Updated dependencies [8a120f6]
  - @sebspark/openapi-core@4.1.14
  - @sebspark/otel@4.1.2

## 5.4.2

### Patch Changes

- Updated dependencies [764bac9]
  - @sebspark/openapi-core@4.1.13

## 5.4.1

### Patch Changes

- Updated dependencies [e732b02]
  - @sebspark/openapi-core@4.1.12

## 5.4.0

### Minor Changes

- 35d5f20: Express Request properties are now reachable

## 5.3.12

### Patch Changes

- Updated dependencies [e9a7a28]
  - @sebspark/openapi-core@4.1.11
  - @sebspark/otel@4.1.1

## 5.3.11

### Patch Changes

- Updated dependencies [7494311]
  - @sebspark/otel@4.1.0

## 5.3.10

### Patch Changes

- Updated dependencies [4124516]
- Updated dependencies [4e12590]
  - @sebspark/openapi-core@4.1.10
  - @sebspark/otel@4.0.1

## 5.3.9

### Patch Changes

- Updated dependencies [4468501]
  - @sebspark/openapi-core@4.1.9

## 5.3.8

### Patch Changes

- Updated dependencies [f07a679]
  - @sebspark/otel@4.0.0

## 5.3.7

### Patch Changes

- Updated dependencies [aff5f58]
  - @sebspark/openapi-core@4.1.8
  - @sebspark/otel@3.0.4

## 5.3.6

### Patch Changes

- Updated dependencies [e734e5a]
  - @sebspark/openapi-core@4.1.7

## 5.3.5

### Patch Changes

- Updated dependencies [50aa72a]
  - @sebspark/openapi-core@4.1.6

## 5.3.4

### Patch Changes

- Updated dependencies [ae4b9bf]
  - @sebspark/otel@3.0.3

## 5.3.3

### Patch Changes

- @sebspark/otel@3.0.2

## 5.3.2

### Patch Changes

- Updated dependencies [22bde73]
  - @sebspark/otel@3.0.1

## 5.3.1

### Patch Changes

- Updated dependencies [91aed80]
- Updated dependencies [91aed80]
  - @sebspark/otel@3.0.0
  - @sebspark/openapi-core@4.1.5

## 5.3.0

### Minor Changes

- 2f554f8: Router now logs full http attributes

## 5.2.0

### Minor Changes

- cd9e760: Duration added to openapie-express routes

### Patch Changes

- @sebspark/otel@2.2.3

## 5.1.5

### Patch Changes

- @sebspark/otel@2.2.2

## 5.1.4

### Patch Changes

- @sebspark/otel@2.2.1

## 5.1.3

### Patch Changes

- Updated dependencies [3d2415a]
  - @sebspark/otel@2.2.0

## 5.1.2

### Patch Changes

- 67871de: Otel now warns on stdout. Also dependency updates.
- Updated dependencies [67871de]
  - @sebspark/otel@2.1.8

## 5.1.1

### Patch Changes

- 12b0e08: Route span uses correct url

## 5.1.0

### Minor Changes

- acb0290: Added instrumentation

## 5.0.18

### Patch Changes

- 736a0b3: No bundling of packages in packages
- Updated dependencies [736a0b3]
  - @sebspark/openapi-core@4.1.4

## 5.0.17

### Patch Changes

- Updated dependencies [ed8453b]
  - @sebspark/openapi-core@4.1.3

## 5.0.16

### Patch Changes

- Updated dependencies [2241dc7]
  - @sebspark/openapi-core@4.1.2

## 5.0.15

### Patch Changes

- Updated dependencies [063d384]
  - @sebspark/openapi-core@4.1.1

## 5.0.14

### Patch Changes

- 80e6230: Updated dependencies

## 5.0.13

### Patch Changes

- Updated dependencies [d164617]
  - @sebspark/openapi-core@4.1.0

## 5.0.12

### Patch Changes

- Updated dependencies [043373c]
  - @sebspark/openapi-core@4.0.14

## 5.0.11

### Patch Changes

- Updated dependencies [11a11ce]
  - @sebspark/openapi-core@4.0.13

## 5.0.9

### Patch Changes

- 48ab717: Updated dependencies
- Updated dependencies [48ab717]
  - @sebspark/openapi-core@4.0.11
  - @sebspark/otel@2.0.9

## 5.0.8

### Patch Changes

- cc28876: Updated dependencies
- Updated dependencies [cc28876]
  - @sebspark/openapi-core@4.0.10

## 5.0.7

### Patch Changes

- ef9ccdc: Updated to latest express version

## 5.0.6

### Patch Changes

- 66925c5: chore: expose tsdown as spark-build
- Updated dependencies [66925c5]
  - @sebspark/openapi-core@4.0.9

## 5.0.5

### Patch Changes

- cacbaf5: chore: upgrade dependencies
- Updated dependencies [cacbaf5]
  - @sebspark/openapi-core@4.0.8

## 5.0.4

### Patch Changes

- c32b9e3: chore: migrate to tsdown
- Updated dependencies [c32b9e3]
  - @sebspark/openapi-core@4.0.7

## 5.0.3

### Patch Changes

- 2e611c9: fix: dependencies
- Updated dependencies [2e611c9]
  - @sebspark/openapi-core@4.0.6

## 5.0.2

### Patch Changes

- 5bf3ac7: chore: update dependencies for express-serve-static-core
- Updated dependencies [5bf3ac7]
  - @sebspark/openapi-core@4.0.4

## 5.0.1

### Patch Changes

- 4b210c2: Standardized on a common build script
- Updated dependencies [4b210c2]
  - @sebspark/openapi-core@4.0.3
  - @sebspark/otel@2.0.5

## 5.0.0

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler
- Updated dependencies [0bd138b]
- Updated dependencies [7e5c2e9]
  - @sebspark/tsconfig@2.0.0
  - @sebspark/openapi-core@4.0.2
  - @sebspark/otel@2.0.2

## 4.0.1

### Patch Changes

- d801e1e: Updated dependencies and fixed some exports
- Updated dependencies [d801e1e]
  - @sebspark/openapi-core@4.0.1
  - @sebspark/otel@2.0.1

## 4.0.0

### Major Changes

- 0864ec2: ESM only. Minimum node version 22

### Patch Changes

- Updated dependencies [0864ec2]
  - @sebspark/openapi-core@4.0.0
  - @sebspark/otel@2.0.0

## 3.0.1

### Patch Changes

- 3a40e49: Cleaned up dependencies
- Updated dependencies [3a40e49]
  - @sebspark/openapi-core@3.0.1
  - @sebspark/otel@1.1.4

## 3.0.0

### Major Changes

- 604c94a: All logging is done through @sepspark/otel

### Patch Changes

- Updated dependencies [604c94a]
- Updated dependencies [604c94a]
  - @sebspark/openapi-core@3.0.0
  - @sebspark/otel@1.1.3

## 2.0.4

### Patch Changes

- 5c6e183: Updated dependencies
- Updated dependencies [5c6e183]
  - @sebspark/openapi-core@2.3.4

## 2.0.3

### Patch Changes

- 06948d0: Updated dependencies
- Updated dependencies [06948d0]
  - @sebspark/openapi-core@2.2.1

## 2.0.2

### Patch Changes

- eaa6cbf: Fix support for 204 routes.

## 2.0.1

### Patch Changes

- fde8ea1: Update dependencies.
- Updated dependencies [fde8ea1]
  - @sebspark/openapi-core@2.0.1

## 2.0.0

### Major Changes

- 1ef46ab: Updated express to v5

### Patch Changes

- Updated dependencies [1ef46ab]
  - @sebspark/openapi-core@2.0.0

## 1.1.6

### Patch Changes

- 8308772: Updated vulnerable dependencies (express and axios)
- Updated dependencies [8308772]
  - @sebspark/openapi-core@1.5.4

## 1.1.5

### Patch Changes

- 6420f5e: Fixed vulnerable express dependency

## 1.1.4

### Patch Changes

- 93a37b3: Patch dependencies
- Updated dependencies [93a37b3]
  - @sebspark/openapi-core@1.5.1

## 1.1.3

### Patch Changes

- d587d94: Errors are passed on through middleware

## 1.1.2

### Patch Changes

- c0b59f2: Errors are serialized with stack for non production env
- Updated dependencies [c0b59f2]
  - @sebspark/openapi-core@1.4.2

## 1.1.1

### Patch Changes

- 938d7b5: Updated express to fix CVE-2024-29041

## 1.1.0

### Minor Changes

- a71af0c: Dates are now typed as Date, except for after serialization

### Patch Changes

- Updated dependencies [a71af0c]
  - @sebspark/openapi-core@1.1.0

## 1.0.0

### Major Changes

- ae03155: First major version. Typegen now accepts json and yaml. It also accepts either a file or a dir as input. Server and Client now return objects containing data and headers.

### Patch Changes

- Updated dependencies [ae03155]
  - @sebspark/openapi-core@1.0.0

## 0.1.0

### Minor Changes

- f20c83b: First implementation of OpenAPI -> Typescript with server an client

### Patch Changes

- Updated dependencies [f20c83b]
  - @sebspark/openapi-core@0.1.0
