# `@sebspark/tracing`

Use Opentelemetry for collecting traces and exporting to Cloud Trace


### How to use

```javascript
/* eslint-disable @typescript-eslint/no-var-requires */
import { setupTracing } from '@sebspark/tracing'

const serviceName = 'core'

if (process.env.TRACING_PROJECT_ID) {
  setupTracing({
    serviceName,
    projectId: process.env.TRACING_PROJECT_ID,
  })
} else if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  setupTracing({
    serviceName,
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  })
}

// Sadly we need to wait a bit for the tracing to be initialized
setTimeout(() => {
  require('./run')
}, 100)
```
