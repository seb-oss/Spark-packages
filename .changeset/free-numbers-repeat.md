---
"@sebspark/opentelemetry-instrumentation-opensearch": patch
"@sebspark/socket.io-gcp-pubsub-emitter": patch
"@sebspark/openapi-typegen": patch
"@sebspark/spanner-migrate": patch
"@sebspark/avsc-isometric": patch
"@sebspark/openapi-client": patch
"@sebspark/promise-cache": patch
"@sebspark/health-check": patch
"@sebspark/opensearch": patch
"@sebspark/memredis": patch
"@sebspark/test-iap": patch
"@sebspark/gcp-iam": patch
"@sebspark/logging": patch
"@sebspark/pubsub": patch
"@sebspark/otel": patch
---

Bump dependencies. Security fixes:

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
