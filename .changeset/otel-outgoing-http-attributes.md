---
"@sebspark/otel": patch
---

Fix outgoing HTTP span attributes and tracer edge cases:

- `requestHook` read `port` and `headers` from the `ClientRequest`, but `ClientRequest` has neither. Every outgoing `http`/`https` span was therefore overwritten with port 80, scheme `http`, a `url.full` without the port, and no captured request headers. The port now comes from the `host` header, the scheme from `protocol`, and headers from `getHeader`.
- `withTrace` and `withTraceSync` treated span options without `attributes`, `kind` or `startTime` (for example `{ root: true }`) as a parent span and crashed. Spans are now detected by shape and anything else is treated as options.
- When a value that is not an `Error` is thrown inside `withTrace` or `withTraceSync`, the span's error status now carries its message instead of `undefined`.
- `GcpJsonLogExporter` ignores `trace_id` and `span_id` attributes that are not strings.
- The README examples call the instrumentation factories (`instrumentations.http()`), as the current API requires.
