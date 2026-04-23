# `@sebspark/otel`

Unified **OpenTelemetry** implementation for logging, tracing, and metrics — with environment detection, auto-instrumentation, and clean console output for local development.

---

## Use logger, tracer, and metrics

Install:

```sh
npm install @sebspark/otel
# or
yarn add @sebspark/otel
# or
pnpm add @sebspark/otel
```

### Initialization

**This must be the first import in your application:**

```ts
import { initialize, instrumentations, dispose } from '@sebspark/otel'

await initialize(
  instrumentations.undici,
  instrumentations.http,
  instrumentations.express,
  instrumentations.redis,
)

// start your application

// Add a listener for shutdown and call OTEL dispose to ensure messages
// are flushed
process.on('SIGTERM', async () => {
  await dispose()
})
```

Automatically:

- Initializes the OpenTelemetry SDK
- Auto-instruments common libraries (see table below)
- Enables W3C Trace Context propagation
- Detects environment and adds `resourceAttributes`
- Links logs with `trace_id` and `span_id`
- Handles graceful shutdown on `SIGTERM`

### Available instrumentations

| Key | Library |
|---|---|
| `instrumentations.http` | `@opentelemetry/instrumentation-http` |
| `instrumentations.express` | `@opentelemetry/instrumentation-express` |
| `instrumentations.grpc` | `@opentelemetry/instrumentation-grpc` |
| `instrumentations.redis` | `@opentelemetry/instrumentation-redis` |
| `instrumentations.undici` | `@opentelemetry/instrumentation-undici` |
| `instrumentations.socketIo` | `@opentelemetry/instrumentation-socket.io` |
| `instrumentations.dns` | `@opentelemetry/instrumentation-dns` |
| `instrumentations.net` | `@opentelemetry/instrumentation-net` |
| `instrumentations.fs` | `@opentelemetry/instrumentation-fs` |
| `instrumentations.opensearch` | `@sebspark/opentelemetry-instrumentation-opensearch` |

All instrumentations are lazy-loaded — only the ones passed to `initialize` are imported.

### Production setup with `--import`

The recommended pattern is to build `otel.ts` as a separate entry point and load it via Node's `--import` flag so it runs before any application code:

**`src/otel.ts`**
```ts
import { initialize, instrumentations } from '@sebspark/otel'
import pkg from '../package.json' with { type: 'json' }

process.env.OTEL_SERVICE_NAME ??= pkg.name
process.env.OTEL_SERVICE_VERSION ??= pkg.version

await initialize(
  instrumentations.http,
  instrumentations.express,
  instrumentations.grpc,
  instrumentations.redis,
  instrumentations.undici,
)
```

Build both entry points:
```sh
spark-build src/index.ts src/otel.ts
```

Start the application with `--import`:
```dockerfile
ENTRYPOINT ["node", "--import=./dist/otel.mjs", "./dist/index.mjs"]
```

This guarantees OTEL is fully initialized before the first line of application code runs, regardless of import order.

---

### Logging

```ts
import { getLogger } from '@sebspark/otel'

const logger = getLogger()

// Will do nothing if OTEL is not yet initialized
logger.debug('debug message')
logger.info('something happened')
logger.warn('almost bad')
logger.error('very bad')
```

Logs inside active spans automatically include:
- `trace_id`
- `span_id`
- `service.name`
- `service.version`

---

### Tracing

```ts
import { getTracer } from '@sebspark/otel'

// Will throw if OTEL is not yet initialized
const tracer = getTracer()

await tracer.withTrace('trace.name', async (span) => {
  span.setAttribute('user.id', '123')
  // do something...
})
```

If the callback throws:
- Span is marked as `ERROR`
- Exception is recorded
- Span is ended properly

Synchronous variant:

```ts
tracer.withTraceSync('init.config', (span) => {
  // synchronous code
  span.setStatus({ code: SpanStatusCode.OK })
})
```

Nested:

```ts
await tracer.withTrace('trace.name', async (span1) => {
  span1.setAttribute('user.id', '123')

  await tracer.withTrace('trace.name2', span1, async (span2) => {
    // do stuff
  })
})
```

Manual span usage:

```ts
const span = tracer.startSpan('manual-operation')
span.setAttribute('manual', true)
// work...
span.end()
```

---

### Metrics

```ts
import { getMeter } from '@sebspark/otel'

// Will throw if OTEL is not yet initialized
const meter = getMeter()

const counter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
})

counter.add(1, {
  route: '/api/hello',
  method: 'GET',
})
```

---

## Configure for cloud use (with OpenTelemetry Collector)

When deployed to **Cloud Run**, **GKE**, or other cloud environments, telemetry automatically exports to your configured **OpenTelemetry Collector**.

Set these environment variables:

| Variable                        | Description                                                                                           | Example                       |
|---------------------------------|-------------------------------------------------------------------------------------------------------|-------------------------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT`   | Collector endpoint                                                                                    | `http://otel-collector:4318`  |
| `OTEL_SERVICE_NAME`             | Override detected service name                                                                        | `trade-api`                   |
| `OTEL_SERVICE_VERSION`          | Version of this instance                                                                              | `1.2.3`                       |
| `OTEL_SIMPLE_SPAN_PROCESSOR`    | Makes OTel use the `SimpleSpanProcessor` instead of `BatchSpanProcessor`. Recommended for batch jobs that may produce oversized batches. | `true` |

Additional GCP/Kubernetes context is auto-detected:

| Env Variable              | Attribute Key         | Example           |
|---------------------------|-----------------------|-------------------|
| `K_SERVICE`               | `cloud.run.service`   | `trade-api`       |
| `K_REVISION`              | `cloud.run.revision`  | `trade-api-v15`   |
| `POD_NAME`                | `k8s.pod_name`        | `api-1234`        |
| `KUBERNETES_SERVICE_HOST` | `cloud.orchestrator`  | `kubernetes`      |
| `GCP_PROJECT`             | `cloud.account.id`    | `my-gcp-project`  |

---

## Configure for local use (dev logging)

In development, `@sebspark/otel` outputs human-readable **logs**, **spans**, and **metrics** directly to the console.

---

### Environment variables

| Variable        | Affects | Values                                   | Description                                                                            |
|-----------------|---------|------------------------------------------|----------------------------------------------------------------------------------------|
| `LOG_LEVEL`     | Logs    | `debug,info,warn,error`                  | Minimum severity to print                                                              |
| `SPAN_LEVEL`    | Traces  | `OK`, `ERROR`, `UNSET` (comma-separated) | Only trees containing **at least one** span with one of these statuses will be printed |
| `METRIC_FILTER` | Metrics | Glob patterns (comma-separated)          | Only metrics matching any of the patterns are shown                                    |

---

### Logs

Filtered by `LOG_LEVEL`:

```sh
LOG_LEVEL=warn yarn dev
```

```
⚠️  [trade-api@1.2.3] GET /orders/limit-exceeded      WARN    trace_id=abc123 span_id=def456
❌  [trade-api@1.2.3] Order validation failed         ERROR   trace_id=abc123 span_id=def456
```

---

### Spans

Filtered by `SPAN_LEVEL` — the entire span **tree** is printed only if **at least one** span in the tree matches the status.

```sh
SPAN_LEVEL=ERROR yarn dev
```

```
[test@1.0.0] 12:00:00.000
└─ express                 ████████████████████                OK     (0 ms–1.00 s)
   └─ middleware:auth      ███████                             OK     (0 ms–0.20 s)
   └─ handler:getUser      ████████████████████                ERROR  (0 ms–1.00 s)
```

```sh
SPAN_LEVEL=OK,ERROR yarn dev
```

```
[test@1.0.0] 12:01:00.000
└─ express                 ████████████████████                OK     (0 ms–1.00 s)
   └─ middleware:auth      ███████                             OK     (0 ms–0.20 s)
```

---

### Metrics

Filtered by `METRIC_FILTER`:

```sh
METRIC_FILTER=http.*,db.* yarn dev
```

```
📊 [trade-api@1.2.3] 12:00:00.000  📊  express http.server.duration 240ms {route=/api/hello method=GET}
📊 [trade-api@1.2.3] 12:00:01.000  📊  pg db.query.count 1 {query=SELECT * FROM users}
```
