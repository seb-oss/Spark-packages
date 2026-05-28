---
"@sebspark/promise-cache": major
"@sebspark/opentelemetry-instrumentation-opensearch": patch
"@sebspark/socket.io-gcp-pubsub-emitter": patch
"@sebspark/spanner-migrate": patch
"@sebspark/avsc-isometric": patch
"@sebspark/health-check": patch
"@sebspark/opensearch": patch
"@sebspark/test-iap": patch
"@sebspark/tsconfig": patch
"@sebspark/otel": patch
---

Upgrade `redis` to v6 in `@sebspark/promise-cache` and bump minor dependencies across the workspace.

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
