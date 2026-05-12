# @sebspark/expect-eventually

## 0.1.4

### Patch Changes

- 41bb8f2: ### `@sebspark/openapi-core`

  `fromAxiosError` no longer references the `AxiosError` type in its signature. It now accepts `unknown` and uses a local duck-typed interface to extract the relevant fields. This removes the `axios` import from the published `dist/index.d.mts`, preventing downstream bundlers (rolldown/tsdown) from treating `AxiosError` as a missing value export.

  ### `@sebspark/tsconfig`

  Added `verbatimModuleSyntax: true` to `base.json`. All packages in the monorepo now emit `import type` modifiers correctly and TypeScript enforces type-only imports at typecheck time.

  ### `@sebspark/openapi-client`

  Updated `fromAxiosError` call site to pass `error` directly as `unknown` instead of casting to `AxiosError`.

  ### Other packages

  Dependency updates.

## 0.1.3

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 0.1.2

### Patch Changes

- e9a7a28: Updated dependencies

## 0.1.1

### Patch Changes

- 4e12590: Updated dependencies

## 0.1.0

### Minor Changes

- aff5f58: First release
