---
"@sebspark/otel": patch
---

Fix "Attempted duplicate registration of API: logs" at startup. Log record processors are now passed to `NodeSDK`, so it no longer creates a second, env-based `LoggerProvider` (and stray OTLP log exporter).
