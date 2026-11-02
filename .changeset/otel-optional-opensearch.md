---
"@sebspark/otel": minor
---

`@sebspark/opentelemetry-instrumentation-opensearch` is now an optional peer dependency instead of a dependency. Consumers who never use OpenSearch no longer install it or get an unmet-peer warning for `@opensearch-project/opensearch`.

**Action required** if you use `instrumentations.opensearch`: install `@sebspark/opentelemetry-instrumentation-opensearch` and `@opensearch-project/opensearch` yourself. Without them, `instrumentations.opensearch()` rejects with an error naming the packages to install.
