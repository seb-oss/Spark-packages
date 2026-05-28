# @sebspark/tsconfig

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
