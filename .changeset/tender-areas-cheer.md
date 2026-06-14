---
"@sebspark/opentelemetry-instrumentation-opensearch": patch
"@sebspark/socket.io-gcp-pubsub-emitter": patch
"@sebspark/spanner-migrate": patch
"@sebspark/promise-cache": patch
"@sebspark/health-check": patch
"@sebspark/opensearch": patch
"@sebspark/memredis": patch
"@sebspark/test-iap": patch
"@sebspark/otel": patch
---

Fix `@sebspark/memredis` so Redis clients are assignable to `IPersistor` by widening the pub/sub subscription return types to accept both MemRedis and node-redis implementations.

Also update supporting dependencies across the affected packages.
