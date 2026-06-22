# @sebspark/iso-4217

## 1.0.24

### Patch Changes

- 3111112: Openapi client args are now PartiallySerialized

  Also: dependency updates

## 1.0.23

### Patch Changes

- e0eda57: Updated dependencies

## 1.0.22

### Patch Changes

- 41bb8f2: ### `@sebspark/openapi-core`

  `fromAxiosError` no longer references the `AxiosError` type in its signature. It now accepts `unknown` and uses a local duck-typed interface to extract the relevant fields. This removes the `axios` import from the published `dist/index.d.mts`, preventing downstream bundlers (rolldown/tsdown) from treating `AxiosError` as a missing value export.

  ### `@sebspark/tsconfig`

  Added `verbatimModuleSyntax: true` to `base.json`. All packages in the monorepo now emit `import type` modifiers correctly and TypeScript enforces type-only imports at typecheck time.

  ### `@sebspark/openapi-client`

  Updated `fromAxiosError` call site to pass `error` directly as `unknown` instead of casting to `AxiosError`.

  ### Other packages

  Dependency updates.

## 1.0.21

### Patch Changes

- cf4ca8e: Export `Filter`, `MethodCall`, `MethodCallBuilder`, and `ResponseCb` from `@sebspark/emulator` so that packages wrapping `createEmulator<T>()` can name the return types in their generated declaration files (fixes TS4023).

  Dependency updates:
  - `@opentelemetry/*` instrumentation packages: `0.216.0` → `0.217.0`; `instrumentation-undici`: `0.26.0` → `0.27.0`; resource detectors, individual instrumentations bumped to latest patch/minor releases
  - `@google-cloud/spanner`: `8.7.0` → `8.7.1`
  - `fast-xml-parser`: `5.7.2` → `5.7.3`
  - Dev: `turbo` `2.9.8` → `2.9.9`, `knip` `6.11.0` → `6.12.0`, `syncpack` `14.3.1` → `15.0.0`

## 1.0.20

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 1.0.19

### Patch Changes

- e9a7a28: Updated dependencies

## 1.0.18

### Patch Changes

- 4e12590: Updated dependencies

## 1.0.17

### Patch Changes

- aff5f58: Updated dependencies

## 1.0.16

### Patch Changes

- 67d6129: Updated dependencies

## 1.0.15

### Patch Changes

- 67871de: Otel now warns on stdout. Also dependency updates.

## 1.0.14

### Patch Changes

- 6d72f97: Updated dependencies

## 1.0.13

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 1.0.12

### Patch Changes

- 2241dc7: Updated dependencies

## 1.0.11

### Patch Changes

- 80e6230: Updated dependencies

## 1.0.10

### Patch Changes

- 112a381: Updated dependencies

## 1.0.9

### Patch Changes

- c8dcadb: Updated dependencies

## 1.0.8

### Patch Changes

- 11a11ce: Updated dependencies

## 1.0.6

### Patch Changes

- b40eb86: Updated dependencies

## 1.0.5

### Patch Changes

- e0cb5ee: Updated build from tsup to tsdown

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

- 0864ec2: Minimum node version 22

## 0.2.2

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 0.2.1

### Patch Changes

- 604c94a: Updated dependencies

## 0.2.0

### Minor Changes

- 431e989: Add GBX (Pence sterling).

## 0.1.3

### Patch Changes

- 93a37b3: Patch dependencies

## 0.1.2

### Patch Changes

- a0d6642: Reduce the amount of generated types. From 1086 lines to 11.
- a0d6642: Fix typo for currencyNumber

## 0.1.1

### Patch Changes

- 41af766: Adding NPM keywords

## 0.1.0

### Minor Changes

- cd0a6d2: Publish ISO-4217 package.
