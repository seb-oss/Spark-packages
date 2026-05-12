---
"@sebspark/socket.io-gcp-pubsub-emitter": patch
"@sebspark/expect-eventually": patch
"@sebspark/openapi-typegen": patch
"@sebspark/spanner-migrate": patch
"@sebspark/openapi-client": patch
"@sebspark/openapi-core": patch
"@sebspark/cli-tester": patch
"@sebspark/iso-4217": patch
"@sebspark/tsconfig": patch
"@sebspark/pubsub": patch
"@sebspark/otel": patch
---

### `@sebspark/openapi-core`

`fromAxiosError` no longer references the `AxiosError` type in its signature. It now accepts `unknown` and uses a local duck-typed interface to extract the relevant fields. This removes the `axios` import from the published `dist/index.d.mts`, preventing downstream bundlers (rolldown/tsdown) from treating `AxiosError` as a missing value export.

### `@sebspark/tsconfig`

Added `verbatimModuleSyntax: true` to `base.json`. All packages in the monorepo now emit `import type` modifiers correctly and TypeScript enforces type-only imports at typecheck time.

### `@sebspark/openapi-client`

Updated `fromAxiosError` call site to pass `error` directly as `unknown` instead of casting to `AxiosError`.

### Other packages

Dependency updates.
