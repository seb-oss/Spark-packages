# @sebspark/socket.io-gcp-pubsub-emitter

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
