# `@sebspark/otel`

Open Telemetry implementation of logging, tracing and metrics

## Usage

Run: 

```sh
npm install @sebspark/otel
# or
yarn add @sebspark/otel
# or
pnpm add @sebspark/otel
```

**Initialization and Context Detection**

The **OpenTelemetry SDK** is automatically initialized when you import `@sebspark/otel`.

**This should be the first import in your application.**

```ts
import '@sebspark/otel'
```

This setup:

- Uses **OpenTelemetry auto-instrumentations** to trace supported libraries
  - **HTTP**, **gRPC**, **Redis**, **PostgreSQL** etc.
- **Auto-detects environment metadata**, including:
  - **GCP** service name (e.g., **Cloud Run**, **GKE**, **GCE**, etc.)
  - Instance and zone/region
- Enables **W3C Trace Context** propagation across async operations and network boundaries
- Automatically links logs with `trace_id` and `span_id` inside active spans
- Supports clean shutdown via `SIGTERM` (e.g. **Cloud Run**, **Kubernetes**)

In **GCP** environments, this ensures that traces are correlated across **Cloud Logging**, **Cloud Trace**, and **Cloud Monitoring** without extra setup.

#### Environment-aware attributes

The following values are detected and attached as `resourceAttributes`:

**Env Variable**        | **Attribute Key**       | **Description**
------------------------|-------------------------|-------------------------------
OTEL_SERVICE_NAME       | service.name            | Overrides service name
OTEL_SERVICE_VERSION    | service.version         | Version of the current service
K_SERVICE               | cloud.run.service       | Cloud Run service name
K_REVISION              | cloud.run.revision      | Cloud Run revision
K_CONFIGURATION         | cloud.run.configuration | Cloud Run config
POD_NAME                | k8s.pod_name            | Kubernetes pod name
POD_NAMESPACE           | k8s.namespace_name      | Kubernetes namespace
KUBERNETES_SERVICE_HOST | cloud.orchestrator      | Set to 'kubernetes' if present
GCP_PROJECT             | cloud.account.id        | GCP project ID
CLOUD_PROVIDER          | cloud.provider          | e.g. 'gcp', 'aws', etc.

---

### Logging

The logger automatically includes `trace_id` and `span_id` if available.

```ts
import { getLogger } from '@sebspark/otel'

const logger = getLogger()

logger.debug('message')
logger.info('message')
logger.warn('message')
logger.error('message')
```

---

### Metrics

You can use the metrics API to create and export custom application-level metrics.

```ts
import { getMeter } from '@sebspark/otel'

const meter = getMeter()

const counter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests'
})

counter.add(1, {
  route: '/api/hello',
  method: 'GET'
})
```

---

### Tracing

The tracer helps you capture **distributed traces** across services and automatically links logs with `trace_id` and `span_id` when called inside a span context.

#### Get a tracer

```ts
import { getTracer } from '@sebspark/otel'

const tracer = getTracer()
```

Optionally override the service name:

```ts
const tracer = getTracer('my-custom-service')
```

#### Automatically wrap logic in a span

**Async**

```ts
await tracer.withTrace('trace name', async (span) => {
  // span is active here
  span.setAttribute('custom.attribute', 'value')
})
```

**Sync**

```ts
tracer.withTraceSync('init.config', () => {
  // synchronous logic
})
```

**Errors**

If an error is thrown during an auto traced function:

- The span is marked with `SpanStatusCode.ERROR`
- The error is recorded via `span.recordException()`
- The span is always ended correctly

#### Manual control

```ts
const span = tracer.startSpan('manual-task')
span.setAttribute('manual', true)
// do work...
span.end()
```

#### Nested span attributes

Any span created via `withTrace` or `withTraceSync` will automatically inherit these attributes from the parent (if present):

- `parent_service_name`
- `parent_span_name`

This makes cross‑service tracing easier to follow in tools like **Google Cloud Trace**, **Jaeger** or **Grafana Tempo**.
