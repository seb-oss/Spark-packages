# @sebspark/otel

## 5.0.1

### Patch Changes

- b7c7a3b: chore(deps): bump @opentelemetry/instrumentation-redis from 0.72.0 to 0.73.0
- 27390d7: chore(deps): bump @opentelemetry/sdk-logs from 3.0.0 to 3.1.0
- 3aaefe6: chore(deps): bump @opentelemetry/core from 3.0.0 to 3.1.0
- b6d33b6: chore(deps): bump @opentelemetry/instrumentation-express from 0.72.0 to 0.73.0
- e305140: chore(deps): bump @opentelemetry/instrumentation from 0.300.0 to 0.301.0
- 3627902: chore(deps): bump @opentelemetry/sdk-trace from 3.0.0 to 3.1.0
- 37ded25: chore(deps): bump @opentelemetry/instrumentation-net from 0.68.0 to 0.69.0
- e614460: chore(deps): bump @opentelemetry/instrumentation-undici from 0.34.0 to 0.35.0
- f85cac1: chore(deps): bump @opentelemetry/exporter-trace-otlp-http from 0.300.0 to 0.301.0
- 987f983: chore(deps): bump @opentelemetry/instrumentation-socket.io from 0.71.0 to 0.72.0
- 99a7cb1: chore(deps): bump @opentelemetry/resource-detector-gcp from 0.59.0 to 0.60.0
- 74e1c58: chore(deps): bump @opentelemetry/resource-detector-container from 0.9.0 to 0.9.1
- ce46993: chore(deps): bump @opentelemetry/resources from 3.0.0 to 3.1.0
- 7fc0fdc: chore(deps): bump @opentelemetry/sdk-node from 0.300.0 to 0.301.0
- d69f0f5: chore(deps): bump @opentelemetry/exporter-metrics-otlp-http from 0.300.0 to 0.301.0
- fd87c82: chore(deps): bump @opentelemetry/exporter-logs-otlp-http from 0.300.0 to 0.301.0
- 96c206a: chore(deps): bump @opentelemetry/instrumentation-http from 0.300.0 to 0.301.0
- 5b5280c: chore(deps): bump @opentelemetry/sdk-metrics from 3.0.0 to 3.1.0
- b48c10c: chore(deps): bump @opentelemetry/instrumentation-dns from 0.67.0 to 0.68.0
- ca332cb: chore(deps): bump @opentelemetry/instrumentation-fs from 0.43.0 to 0.44.0
- Updated dependencies [3aaefe6]
- Updated dependencies [e305140]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.4.3

## 5.0.0

### Major Changes

- 0e28924: **Breaking:** `@sebspark/opentelemetry-instrumentation-opensearch` and `@opensearch-project/opensearch` are now optional peer dependencies. `@sebspark/otel` no longer installs them, and applications that don't use OpenSearch no longer get an unmet-peer warning for `@opensearch-project/opensearch`.

  **Who needs to act:**

  Only applications that call `instrumentations.opensearch()`. Check with:

  ```sh
  grep -rn "instrumentations.opensearch" . --exclude-dir=node_modules --exclude-dir=dist
  ```

  No match: upgrade without changes.

  **What to do:**

  Before upgrading to 5.0.0, add both packages to your application's `dependencies`:

  ```sh
  yarn add @sebspark/opentelemetry-instrumentation-opensearch @opensearch-project/opensearch
  # or
  npm install @sebspark/opentelemetry-instrumentation-opensearch @opensearch-project/opensearch
  # or
  pnpm add @sebspark/opentelemetry-instrumentation-opensearch @opensearch-project/opensearch
  ```

  Supported versions: `@sebspark/opentelemetry-instrumentation-opensearch@^0.4.2` and `@opensearch-project/opensearch@>=2`.

  With Yarn, also add `@opentelemetry/api@1.10.0`. The instrumentation has it as a peer dependency, and Yarn expects your application to provide it. With Plug'n'Play (`nodeLinker: pnp`, the Yarn default) the instrumentation fails to load without it; with `nodeLinker: node-modules` it removes a peer warning:

  ```sh
  yarn add @opentelemetry/api@1.10.0
  ```

  **What happens if you don't:**

  Typecheck, lint and unit tests still pass. `initialize()` rejects at runtime with:

  ```
  Error: OpenSearch instrumentation could not be loaded. Install @sebspark/opentelemetry-instrumentation-opensearch and @opensearch-project/opensearch (with Yarn PnP also @opentelemetry/api@1.10.0). See https://github.com/seb-oss/Spark-packages/tree/main/packages/otel#opensearch-optional-peer-dependencies
  ```

  The `cause` of the error names the module that could not be found. When otel is loaded with `node --import`, the service does not start.

  4.3.0 and 4.3.1 contained the same change by mistake, released as a minor. 4.3.2 reverted it.

## 4.3.2

### Patch Changes

- bb2a3d5: `@sebspark/opentelemetry-instrumentation-opensearch` is a regular dependency again. In 4.3.0 and 4.3.1 it was an optional peer, so `initialize(instrumentations.opensearch())` crashed with `ERR_MODULE_NOT_FOUND` unless consumers installed it themselves. That was a breaking change released as a minor. No action is needed: anyone who installed it manually can keep or remove it.

## 4.3.1

### Patch Changes

- 75d5a5b: Fix "Attempted duplicate registration of API: logs" at startup. Log record processors are now passed to `NodeSDK`, so it no longer creates a second, env-based `LoggerProvider` (and stray OTLP log exporter).

## 4.3.0

### Minor Changes

- 5091491: `@sebspark/opentelemetry-instrumentation-opensearch` is now an optional peer dependency instead of a dependency. Consumers who never use OpenSearch no longer install it or get an unmet-peer warning for `@opensearch-project/opensearch`.

  **Action required** if you use `instrumentations.opensearch`: install `@sebspark/opentelemetry-instrumentation-opensearch` and `@opensearch-project/opensearch` yourself. Without them, `instrumentations.opensearch()` rejects with an error naming the packages to install.

### Patch Changes

- @sebspark/opentelemetry-instrumentation-opensearch@0.4.2

## 4.2.2

### Patch Changes

- 176ea40: Fix outgoing HTTP span attributes and tracer edge cases:

  - `requestHook` read `port` and `headers` from the `ClientRequest`, but `ClientRequest` has neither. Every outgoing `http`/`https` span was therefore overwritten with port 80, scheme `http`, a `url.full` without the port, and no captured request headers. The port now comes from the `host` header, the scheme from `protocol`, and headers from `getHeader`.
  - `withTrace` and `withTraceSync` treated span options without `attributes`, `kind` or `startTime` (for example `{ root: true }`) as a parent span and crashed. Spans are now detected by shape and anything else is treated as options.
  - When a value that is not an `Error` is thrown inside `withTrace` or `withTraceSync`, the span's error status now carries its message instead of `undefined`.
  - `GcpJsonLogExporter` ignores `trace_id` and `span_id` attributes that are not strings.
  - The README examples call the instrumentation factories (`instrumentations.http()`), as the current API requires.

- Updated dependencies [176ea40]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.4.2

## 4.2.1

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
  - @sebspark/opentelemetry-instrumentation-opensearch@0.4.1

## 4.2.0

### Minor Changes

- ad1e80f: Upgraded to OpenTelemetry 3.0 (`@opentelemetry/api` 1.10).

### Patch Changes

- Updated dependencies [ad1e80f]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.4.0

## 4.1.17

### Patch Changes

- 9f44fbd: Updated dependencies
- Updated dependencies [9f44fbd]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.15

## 4.1.16

### Patch Changes

- 66ac832: * Upgraded to TypeScript 7
  - Replaced tsup with tsdown for package builds
  - Fixed cli-tester stdout parsing, resolving flaky e2e tests across the repo
  - Patched vulnerable transitive dependencies (uuid, socket.io-parser, and others)
- Updated dependencies [66ac832]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.14

## 4.1.15

### Patch Changes

- eefb531: Updated dependencies
- Updated dependencies [eefb531]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.13

## 4.1.14

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

- Updated dependencies [5e9fc45]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.12

## 4.1.13

### Patch Changes

- e0eda57: Updated dependencies
- Updated dependencies [e0eda57]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.11

## 4.1.12

### Patch Changes

- 26d55f0: Fix `@sebspark/memredis` so Redis clients are assignable to `IPersistor` by widening the pub/sub subscription return types to accept both MemRedis and node-redis implementations.

  Also update supporting dependencies across the affected packages.

- Updated dependencies [26d55f0]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.10

## 4.1.11

### Patch Changes

- a6c27f3: Updated dependencies
- Updated dependencies [a6c27f3]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.9

## 4.1.10

### Patch Changes

- 97fe7da: Updated dependencies

## 4.1.9

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

- Updated dependencies [264e665]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.8

## 4.1.8

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

- Updated dependencies [242eb33]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.7

## 4.1.7

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.
- Updated dependencies [c5e9c99]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.6

## 4.1.6

### Patch Changes

- 41bb8f2: ### `@sebspark/openapi-core`

  `fromAxiosError` no longer references the `AxiosError` type in its signature. It now accepts `unknown` and uses a local duck-typed interface to extract the relevant fields. This removes the `axios` import from the published `dist/index.d.mts`, preventing downstream bundlers (rolldown/tsdown) from treating `AxiosError` as a missing value export.

  ### `@sebspark/tsconfig`

  Added `verbatimModuleSyntax: true` to `base.json`. All packages in the monorepo now emit `import type` modifiers correctly and TypeScript enforces type-only imports at typecheck time.

  ### `@sebspark/openapi-client`

  Updated `fromAxiosError` call site to pass `error` directly as `unknown` instead of casting to `AxiosError`.

  ### Other packages

  Dependency updates.

## 4.1.5

### Patch Changes

- a62ddaa: Updated vulnerable dependencies

## 4.1.4

### Patch Changes

- cf4ca8e: Export `Filter`, `MethodCall`, `MethodCallBuilder`, and `ResponseCb` from `@sebspark/emulator` so that packages wrapping `createEmulator<T>()` can name the return types in their generated declaration files (fixes TS4023).

  Dependency updates:
  - `@opentelemetry/*` instrumentation packages: `0.216.0` → `0.217.0`; `instrumentation-undici`: `0.26.0` → `0.27.0`; resource detectors, individual instrumentations bumped to latest patch/minor releases
  - `@google-cloud/spanner`: `8.7.0` → `8.7.1`
  - `fast-xml-parser`: `5.7.2` → `5.7.3`
  - Dev: `turbo` `2.9.8` → `2.9.9`, `knip` `6.11.0` → `6.12.0`, `syncpack` `14.3.1` → `15.0.0`

- Updated dependencies [cf4ca8e]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.5

## 4.1.3

### Patch Changes

- 7d8cc98: Dependabot dependency updates
- Updated dependencies [7d8cc98]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.4

## 4.1.2

### Patch Changes

- 8a120f6: Updated dependencies for all and docs for emulator
- Updated dependencies [8a120f6]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.3

## 4.1.1

### Patch Changes

- e9a7a28: Updated dependencies
- Updated dependencies [e9a7a28]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.2

## 4.1.0

### Minor Changes

- 7494311: Allow consumers to use the SimpleSpanProcessor when needed.

## 4.0.1

### Patch Changes

- 4124516: Updated dependencies
- 4e12590: Updated dependencies
- Updated dependencies [4e12590]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.1

## 4.0.0

### Major Changes

- f07a679: Instrumentations are now methods and accept config

## 3.0.4

### Patch Changes

- aff5f58: Updated dependencies

## 3.0.3

### Patch Changes

- ae4b9bf: OTEL only tries to shut down once

## 3.0.2

### Patch Changes

- Updated dependencies [f202dc3]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.3.0

## 3.0.1

### Patch Changes

- 22bde73: Opensearch instrumentation does not call through to http instrumentation

## 3.0.0

### Major Changes

- 91aed80: Added instrumentation for outgoing http requests and removed SIGTERM listener

### Patch Changes

- Updated dependencies [91aed80]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.2.2

## 2.2.3

### Patch Changes

- Updated dependencies [cd9e760]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.2.1

## 2.2.2

### Patch Changes

- Updated dependencies [b92b79a]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.2.0

## 2.2.1

### Patch Changes

- Updated dependencies [67d6129]
  - @sebspark/opentelemetry-instrumentation-opensearch@0.1.1

## 2.2.0

### Minor Changes

- 3d2415a: Added instrumentation for opensearch

## 2.1.8

### Patch Changes

- 67871de: Otel now warns on stdout. Also dependency updates.

## 2.1.7

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 2.1.6

### Patch Changes

- 5e9294e: chore: use global variables to store otel initialization

## 2.1.5

### Patch Changes

- 23be838: chore: change k8s logs format

## 2.1.4

### Patch Changes

- 6cf0475: chore: format service name, remove wrong characters

## 2.1.3

### Patch Changes

- 8cd0201: Fix for OTEL not initialized spam and double span.end()

## 2.1.2

### Patch Changes

- 1c13543: add missing attribute gcp.log_name

## 2.1.1

### Patch Changes

- 1485c2d: Changed warning level text from WARNING to WARN

## 2.1.0

### Minor Changes

- c60b7a4: chore: change logs formatting

## 2.0.14

### Patch Changes

- 2241dc7: Updated dependencies

## 2.0.13

### Patch Changes

- 80e6230: Updated dependencies

## 2.0.12

### Patch Changes

- c8dcadb: Updated dependencies

## 2.0.11

### Patch Changes

- 11a11ce: Updated dependencies

## 2.0.9

### Patch Changes

- 48ab717: Updated dependencies

## 2.0.8

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

## 2.0.7

### Patch Changes

- 8626deb: Updated vulnerable, transitive jws dependency

## 2.0.6

### Patch Changes

- 7df8217: Updated dependencies

## 2.0.5

### Patch Changes

- 4b210c2: Standardized on a common build script

## 2.0.4

### Patch Changes

- 618a019: Dynamically imported instrumentations

## 2.0.3

### Patch Changes

- eb99a27: Marked opentelemetry dependencies as external

## 2.0.2

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler

## 2.0.1

### Patch Changes

- d801e1e: Updated dependencies and fixed some exports

## 2.0.0

### Major Changes

- 0864ec2: ESM only. Minimum node version 22

## 1.1.4

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 1.1.3

### Patch Changes

- 604c94a: Updated dependencies

## 1.1.2

### Patch Changes

- b8fe201: SpanStatusCode is exported as a value, not a type

## 1.1.1

### Patch Changes

- b86cf2d: Instrumentation warnings are now supressed during testing

## 1.1.0

### Minor Changes

- a8ba986: OTEL exports usable types

## 1.0.5

### Patch Changes

- 90fa604: Changed initialization handling in logger to solve OTEL fail spam

## 1.0.4

### Patch Changes

- 63fc64a: tracer and meter no longer throw before initialization

## 1.0.3

### Patch Changes

- 0e4d66b: Logger swallows messages before initialization

## 1.0.2

### Patch Changes

- 4b1337a: Disabling context before initialize

## 1.0.1

### Patch Changes

- c360c99: Init check is moved to first log call instead of at getLogger()

## 1.0.0

### Major Changes

- d361253: OTEL instrumentation now requires initialize and specific instrumentations

## 0.4.2

### Patch Changes

- d323365: Change error function to be able to receive an error object as parameter

## 0.4.0

### Minor Changes

- 0dc99f6: Console logger is added if LOG_LEVEL is set, even if collector exists

## 0.3.1

### Patch Changes

- fc781e2: Switched places for spanId/traceId

## 0.3.0

### Minor Changes

- 2a7b207: Added span and trace id to span logs

## 0.2.4

### Patch Changes

- 2c32898: Fixed wrongful options copy for span with parent

## 0.2.3

### Patch Changes

- 0288531: Tracer and Meter are asynch and Logger awaits init

## 0.2.2

### Patch Changes

- 005c598: Removed manual context registration

## 0.2.1

### Patch Changes

- ac28d06: No duplicate contextManager

## 0.2.0

### Minor Changes

- cc889fb: Added custom loggers for dev use

## 0.1.0

### Minor Changes

- 3007f53: First, simple implementation of OTEL instrumentation
