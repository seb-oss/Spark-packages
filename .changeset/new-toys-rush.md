---
"@sebspark/opentelemetry-instrumentation-opensearch": patch
"@sebspark/socket.io-gcp-pubsub-emitter": patch
"@sebspark/openapi-express": patch
"@sebspark/spanner-migrate": patch
"@sebspark/openapi-client": patch
"@sebspark/promise-cache": patch
"@sebspark/health-check": patch
"@sebspark/openapi-core": patch
"@sebspark/opensearch": patch
"@sebspark/test-iap": patch
"@sebspark/gcp-iam": patch
"@sebspark/logging": patch
"@sebspark/pubsub": patch
"@sebspark/retry": patch
"@sebspark/otel": patch
---

Resolve protobufjs CVE by pinning to `8.3.0` across all affected packages via root resolutions. Upgraded OpenTelemetry packages to `0.218.0` (which also eliminates the previous hardpin on `protobufjs@8.0.1`), `axios` to `1.16.1`, `ws` to `8.20.1`, `qs` to `6.15.2`, and `@opentelemetry/semantic-conventions` to `1.41.1`.
