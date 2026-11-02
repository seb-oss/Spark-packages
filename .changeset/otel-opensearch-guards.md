---
"@sebspark/opentelemetry-instrumentation-opensearch": patch
---

Response attributes are read with type guards instead of type assertions. Values with an unexpected type, for example a non-numeric `took`, are now omitted instead of being recorded as-is. Non-JSON response bodies are ignored.
