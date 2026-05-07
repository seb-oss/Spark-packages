---
"@sebspark/emulator": minor
"@sebspark/opentelemetry-instrumentation-opensearch": patch
"@sebspark/spanner-migrate": patch
"@sebspark/iso-4217": patch
"@sebspark/otel": patch
---

Export `Filter`, `MethodCall`, `MethodCallBuilder`, and `ResponseCb` from `@sebspark/emulator` so that packages wrapping `createEmulator<T>()` can name the return types in their generated declaration files (fixes TS4023).

Dependency updates:
- `@opentelemetry/*` instrumentation packages: `0.216.0` → `0.217.0`; `instrumentation-undici`: `0.26.0` → `0.27.0`; resource detectors, individual instrumentations bumped to latest patch/minor releases
- `@google-cloud/spanner`: `8.7.0` → `8.7.1`
- `fast-xml-parser`: `5.7.2` → `5.7.3`
- Dev: `turbo` `2.9.8` → `2.9.9`, `knip` `6.11.0` → `6.12.0`, `syncpack` `14.3.1` → `15.0.0`
