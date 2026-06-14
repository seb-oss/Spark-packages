# @sebspark/spanner-migrate

## 2.0.29

### Patch Changes

- 26d55f0: Fix `@sebspark/memredis` so Redis clients are assignable to `IPersistor` by widening the pub/sub subscription return types to accept both MemRedis and node-redis implementations.

  Also update supporting dependencies across the affected packages.

## 2.0.28

### Patch Changes

- a6c27f3: Updated dependencies

## 2.0.27

### Patch Changes

- 494f9b3: Updated dependencies

## 2.0.26

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

## 2.0.25

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

## 2.0.24

### Patch Changes

- c5e9c99: Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.

## 2.0.23

### Patch Changes

- 41bb8f2: ### `@sebspark/openapi-core`

  `fromAxiosError` no longer references the `AxiosError` type in its signature. It now accepts `unknown` and uses a local duck-typed interface to extract the relevant fields. This removes the `axios` import from the published `dist/index.d.mts`, preventing downstream bundlers (rolldown/tsdown) from treating `AxiosError` as a missing value export.

  ### `@sebspark/tsconfig`

  Added `verbatimModuleSyntax: true` to `base.json`. All packages in the monorepo now emit `import type` modifiers correctly and TypeScript enforces type-only imports at typecheck time.

  ### `@sebspark/openapi-client`

  Updated `fromAxiosError` call site to pass `error` directly as `unknown` instead of casting to `AxiosError`.

  ### Other packages

  Dependency updates.

## 2.0.22

### Patch Changes

- cf4ca8e: Export `Filter`, `MethodCall`, `MethodCallBuilder`, and `ResponseCb` from `@sebspark/emulator` so that packages wrapping `createEmulator<T>()` can name the return types in their generated declaration files (fixes TS4023).

  Dependency updates:
  - `@opentelemetry/*` instrumentation packages: `0.216.0` → `0.217.0`; `instrumentation-undici`: `0.26.0` → `0.27.0`; resource detectors, individual instrumentations bumped to latest patch/minor releases
  - `@google-cloud/spanner`: `8.7.0` → `8.7.1`
  - `fast-xml-parser`: `5.7.2` → `5.7.3`
  - Dev: `turbo` `2.9.8` → `2.9.9`, `knip` `6.11.0` → `6.12.0`, `syncpack` `14.3.1` → `15.0.0`

## 2.0.21

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 2.0.20

### Patch Changes

- e9a7a28: Updated dependencies

## 2.0.19

### Patch Changes

- 4124516: Updated dependencies
- 4e12590: Updated dependencies

## 2.0.18

### Patch Changes

- f90d132: Updated dependencies

## 2.0.17

### Patch Changes

- 67d6129: Updated dependencies

## 2.0.16

### Patch Changes

- 6d72f97: Updated dependencies

## 2.0.15

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 2.0.14

### Patch Changes

- ed8453b: Updated dependencies

## 2.0.13

### Patch Changes

- 112a381: Updated dependencies

## 2.0.12

### Patch Changes

- 35ec1a0: Updated dependencies

## 2.0.11

### Patch Changes

- c8dcadb: Updated dependencies

## 2.0.10

### Patch Changes

- 11a11ce: Updated dependencies

## 2.0.8

### Patch Changes

- 48ab717: Updated dependencies

## 2.0.7

### Patch Changes

- b40eb86: Updated dependencies

## 2.0.6

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

## 2.0.5

### Patch Changes

- cc28876: Updated dependencies

## 2.0.4

### Patch Changes

- 7df8217: Updated dependencies

## 2.0.3

### Patch Changes

- 4b210c2: Standardized on a common build script

## 2.0.2

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler

## 2.0.1

### Patch Changes

- d801e1e: Updated dependencies and fixed some exports

## 2.0.0

### Major Changes

- 0864ec2: ESM only. Minimum node version 22

## 1.1.8

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 1.1.7

### Patch Changes

- 604c94a: Updated dependencies

## 1.1.6

### Patch Changes

- 13a1692: Updated yargs dependency

## 1.1.5

### Patch Changes

- 29b9b20: Updated dependencies

## 1.1.4

### Patch Changes

- 5c6e183: Updated dependencies

## 1.1.3

### Patch Changes

- 744b05f: Updated dependencies

## 1.1.2

### Patch Changes

- f95d28e: Fixed flaky migration table update

## 1.1.1

### Patch Changes

- 0bb3f0e: removed ; at the end of alter column

## 1.1.0

### Minor Changes

- 3388fef: Widened up and down columns for migrations and updated Spanner dependency to 8.0.0

## 1.0.1

### Patch Changes

- 06948d0: Updated dependencies

## 1.0.0

### Major Changes

- 58ed044: Rewrite of spanner-migrate to dupport multiple databases. Also first version of cli-tester - a tool for testing @inquirer based cli:s.

## 0.2.0

### Minor Changes

- 7606c20: switched from .ts to .sql migrations files

## 0.1.1

### Patch Changes

- 8dd1a42: Fixed cli

## 0.1.0

### Minor Changes

- aaf51b5: First version of spanner-mock and spanner-migrate
