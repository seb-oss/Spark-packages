# @sebspark/avsc-isometric

## 0.4.14

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

## 0.4.13

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

## 0.4.12

### Patch Changes

- 242eb33: This release primarily updates dependencies across the listed packages, including:
  - Testcontainers v12 upgrades in packages that run integration/e2e tests.
  - Vitest/Biome/Turbo and related tooling updates.
  - Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

  It also includes two targeted fixes:
  - `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
  - `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.

## 0.4.11

### Patch Changes

- 7d8cc98: Dependabot dependency updates

## 0.4.10

### Patch Changes

- 4e12590: Updated dependencies

## 0.4.9

### Patch Changes

- 67d6129: Updated dependencies

## 0.4.8

### Patch Changes

- 6d72f97: Updated dependencies

## 0.4.7

### Patch Changes

- 736a0b3: No bundling of packages in packages

## 0.4.6

### Patch Changes

- ed8453b: Updated dependencies

## 0.4.5

### Patch Changes

- 2241dc7: Updated dependencies

## 0.4.4

### Patch Changes

- 063d384: Updated dependencies

## 0.4.3

### Patch Changes

- c8dcadb: Updated dependencies

## 0.4.2

### Patch Changes

- d1d35ec: Updated webpack

## 0.4.0

### Minor Changes

- aeb488a: Added ESM build

## 0.3.0

### Minor Changes

- 0c29f25: Introduces Avro-based binary serialization for socket.io connections.

  @sebspark/avsc-isometric exposes more types necessary for @sebspark/socket.io-avro

## 0.2.10

### Patch Changes

- 48ab717: Updated dependencies

## 0.2.9

### Patch Changes

- b40eb86: Updated dependencies

## 0.2.8

### Patch Changes

- 7df8217: Updated dependencies

## 0.2.7

### Patch Changes

- 7e5c2e9: Switched to new tsconfig with moduleResolution=bundler

## 0.2.6

### Patch Changes

- 3a40e49: Cleaned up dependencies

## 0.2.5

### Patch Changes

- 29b9b20: Updated dependencies

## 0.2.4

### Patch Changes

- 5c6e183: Updated dependencies

## 0.2.3

### Patch Changes

- 06948d0: Updated dependencies

## 0.2.2

### Patch Changes

- fde8ea1: Update dependencies.

## 0.2.1

### Patch Changes

- 93a37b3: Patch dependencies

## 0.2.0

### Minor Changes

- 216dae7: More dependency fixes!

### Patch Changes

- d50a3b0: Dependency fix

## 0.1.1

### Patch Changes

- d33aa43: Set avsc as dependency and export types

## 0.1.0

### Minor Changes

- 6bd415a: Support referenced schemas.

## 0.0.1

### Patch Changes

- 94abc5e: Created package.
