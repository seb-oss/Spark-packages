---
"@sebspark/avsc-isometric": patch
"@sebspark/avsc-ts": patch
"@sebspark/cli-tester": patch
"@sebspark/emulator": patch
"@sebspark/environment": patch
"@sebspark/expect-eventually": patch
"@sebspark/gcp-iam": patch
"@sebspark/health-check": patch
"@sebspark/hyper-media": patch
"@sebspark/idempotency": patch
"@sebspark/iso-10383": patch
"@sebspark/iso-4217": patch
"@sebspark/logging": patch
"@sebspark/memredis": patch
"@sebspark/openapi-auth-iam": patch
"@sebspark/openapi-client": patch
"@sebspark/openapi-core": patch
"@sebspark/openapi-express": patch
"@sebspark/openapi-typegen": patch
"@sebspark/opensearch": patch
"@sebspark/opentelemetry-instrumentation-opensearch": patch
"@sebspark/otel": patch
"@sebspark/promise-cache": patch
"@sebspark/retry": patch
"@sebspark/socket.io-avro": patch
"@sebspark/socket.io-gcp-pubsub-emitter": patch
"@sebspark/spanner-migrate": patch
"@sebspark/test-iap": patch
"@sebspark/tradeinsight": patch
"@sebspark/trading-hours": patch
"@sebspark/tsconfig": patch
"@sebspark/typed-router": patch
---

* Upgraded to TypeScript 7
* Replaced tsup with tsdown for package builds
* Fixed cli-tester stdout parsing, resolving flaky e2e tests across the repo
* Patched vulnerable transitive dependencies (uuid, socket.io-parser, and others)
