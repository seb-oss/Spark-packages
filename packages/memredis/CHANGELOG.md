# @sebspark/memredis

## 1.0.3

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

## 1.0.2

### Patch Changes

- e0eda57: Updated dependencies

## 1.0.1

### Patch Changes

- 26d55f0: Fix `@sebspark/memredis` so Redis clients are assignable to `IPersistor` by widening the pub/sub subscription return types to accept both MemRedis and node-redis implementations.

  Also update supporting dependencies across the affected packages.

## 1.0.0

### Major Changes

- 0fad123: Initial stable release of `@sebspark/memredis` and `@sebspark/idempotency`.

  `@sebspark/memredis`: in-memory Redis-compatible persistor with full pub/sub support.

  `@sebspark/idempotency`: idempotency guard backed by Redis pub/sub, with `end`-callback API and `AbortSignal` for concurrent conflict detection.

  `@sebspark/promise-cache`: update README to reference `MemRedis` directly; `InMemoryPersistor` re-export retained for backwards compatibility.
