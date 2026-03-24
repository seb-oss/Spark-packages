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

Span name follows the pattern `<operation> <index>` (e.g. `search asset_v0.1.3`) or just `<operation>` for index-less operations like `bulk`. Falls back to the raw path when the path does not contain an underscore-prefixed operation segment.

### Request attributes

Set at span creation, before the request is sent.

| Attribute | Type | Example | Notes |
|---|---|---|---|
| `db.system.name` | string | `opensearch` | Always set |
| `db.operation.name` | string | `search` | Parsed from path (`_search` → `search`). Omitted when path has no operation segment |
| `db.opensearch.index` | string | `asset_v0.1.3` | Omitted for cluster-level operations like `_bulk` |
| `db.query.text` | string | `{"query":{"match_all":{}}}` | The serialized request body. Omitted for bodyless requests or when `dbStatementSerializer: false` |

### Response attributes

Set on the span after a successful response.

| Attribute | Type | Example | Notes |
|---|---|---|---|
| `server.address` | string | `opensearch.example.com` | Hostname of the node that handled the request |
| `server.port` | number | `9200` | Omitted when using the default port for the protocol |
| `http.response.status_code` | number | `200` | HTTP status code of the response |
| `db.opensearch.took` | number | `5` | Time in milliseconds OpenSearch spent executing the request |
| `db.opensearch.timed_out` | boolean | `false` | Whether the request hit the `timeout` threshold |
| `db.opensearch.terminated_early` | boolean | `true` | Whether the request hit the `terminate_after` document limit and returned partial results. Omitted when not present |
| `db.opensearch.shards.total` | number | `5` | Total number of shards the request was executed against |
| `db.opensearch.shards.successful` | number | `5` | Number of shards that responded successfully |
| `db.opensearch.shards.failed` | number | `0` | Number of shards that failed |
| `db.opensearch.shards.skipped` | number | `2` | Number of shards skipped (e.g. due to shard-level filtering). Omitted when not present |
| `db.opensearch.hits.total` | number | `42` | Total number of matching documents. Omitted for non-search responses or when `hits.total` is not an object |
| `db.opensearch.phase_took.can_match` | number | `1` | Time in milliseconds spent in the can-match phase. Only present for DFS queries |
| `db.opensearch.phase_took.dfs_pre_query` | number | `2` | Time in milliseconds spent in the DFS pre-query phase |
| `db.opensearch.phase_took.dfs_query` | number | `3` | Time in milliseconds spent in the DFS query phase |
| `db.opensearch.phase_took.expand` | number | `0` | Time in milliseconds spent expanding search results |
| `db.opensearch.phase_took.fetch` | number | `1` | Time in milliseconds spent fetching documents |
| `db.opensearch.phase_took.query` | number | `4` | Time in milliseconds spent in the query phase |
