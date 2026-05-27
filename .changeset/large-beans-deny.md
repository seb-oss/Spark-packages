---
"@sebspark/opentelemetry-instrumentation-opensearch": patch
"@sebspark/socket.io-gcp-pubsub-emitter": patch
"@sebspark/expect-eventually": patch
"@sebspark/spanner-migrate": patch
"@sebspark/avsc-isometric": patch
"@sebspark/promise-cache": patch
"@sebspark/trading-hours": patch
"@sebspark/health-check": patch
"@sebspark/cli-tester": patch
"@sebspark/opensearch": patch
"@sebspark/test-iap": patch
"@sebspark/otel": patch
---

This release primarily updates dependencies across the listed packages, including:

- Testcontainers v12 upgrades in packages that run integration/e2e tests.
- Vitest/Biome/Turbo and related tooling updates.
- Runtime dependency updates such as `date-fns`, `@inquirer/*`, `socket.io-adapter`, and `ws`.

It also includes two targeted fixes:

- `@sebspark/opensearch`: fixed TypeScript compatibility so strict `SearchRequest<T>` / `SearchRequestBody<T>` can be assigned to OpenSearch API request types, and added a compile-time compatibility test.
- `@sebspark/health-check`: updated the e2e readiness payload assertions and type-only import usage to match current runtime output and TypeScript expectations.
