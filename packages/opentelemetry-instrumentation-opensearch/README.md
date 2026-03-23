# `@sebspark/opentelemetry-instrumentation-opensearch`

OTEL auto instrumentation for OpenSearch

Patches `@opensearch-project/opensearch`'s `Transport` to create `db` CLIENT spans for every request. By default the db span is set as the active context so HTTP child spans are properly parented and W3C trace headers are propagated outbound.

## Use

```ts
import { OpenSearchInstrumentation } from '@sebspark/opentelemetry-instrumentation-opensearch'
import { registerInstrumentations } from '@opentelemetry/instrumentation'

registerInstrumentations({
  instrumentations: [new OpenSearchInstrumentation()],
})
```

### Disabling query capture

By default the request body is captured as `db.query.text`. Disable it if queries contain sensitive data:

```ts
new OpenSearchInstrumentation({ dbStatementSerializer: false })
```

Or provide a custom serializer to redact specific fields:

```ts
new OpenSearchInstrumentation({
  dbStatementSerializer: (params) => {
    const body = params.body as Record<string, unknown>
    return JSON.stringify({ ...body, password: '[redacted]' })
  },
})
```

### Adding custom attributes before the request

Use `requestHook` to attach attributes to each span before the request is sent:

```ts
new OpenSearchInstrumentation({
  requestHook: (span, params) => {
    span.setAttribute('app.opensearch.method', params.method)
  },
})
```

### Adding custom attributes from the response

Use `responseHook` to attach attributes derived from the response (only called on success):

```ts
new OpenSearchInstrumentation({
  responseHook: (span, response) => {
    span.setAttribute('app.opensearch.hits', response.body?.hits?.total?.value ?? 0)
  },
})
```

### Recording the client library version

Set `moduleVersionAttributeName` to record which version of `@opensearch-project/opensearch` made the request:

```ts
new OpenSearchInstrumentation({
  moduleVersionAttributeName: 'db.opensearch.client.version',
})
```

### Suppressing HTTP child spans

By default the db span is set as the active context, so an HTTP instrumentation layer (if registered) will create a child span under it. To suppress all child spans instead:

```ts
new OpenSearchInstrumentation({ suppressInternalInstrumentation: true })
```

## Produced spans

| Attribute | Example | Notes |
|---|---|---|
| `db.system.name` | `opensearch` | Always set |
| `db.operation.name` | `search` | Parsed from path (`_search` → `search`) |
| `db.opensearch.index` | `asset_v0.1.3` | Omitted for cluster-level operations like `bulk` |
| `db.query.text` | `{"query":{"match_all":{}}}` | Omitted when `dbStatementSerializer: false` |
| `server.address` | `localhost` | Set from the connection used for the request |
| `server.port` | `9200` | Omitted when using the default port for the protocol |

Span name follows the pattern `<operation> <index>` (e.g. `search asset_v0.1.3`) or just `<operation>` for index-less operations like `bulk`. Falls back to the raw path when the path does not contain an underscore-prefixed operation segment.
