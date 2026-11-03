---
"@sebspark/otel": patch
---

`@sebspark/opentelemetry-instrumentation-opensearch` is a regular dependency again. In 4.3.0 and 4.3.1 it was an optional peer, so `initialize(instrumentations.opensearch())` crashed with `ERR_MODULE_NOT_FOUND` unless consumers installed it themselves. That was a breaking change released as a minor. No action is needed: anyone who installed it manually can keep or remove it.
