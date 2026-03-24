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

#### Always present on search responses

| Attribute | Type | Example | Description |
|---|---|---|---|
| `server.address` | string | `opensearch.example.com` | Hostname of the node that handled the request |
| `server.port` | number | `9200` | Omitted when using the default port for the protocol |
| `http.response.status_code` | number | `200` | HTTP status code of the response |
| `db.opensearch.took` | number | `5` | Time in milliseconds OpenSearch spent executing the request |
| `db.opensearch.timed_out` | boolean | `false` | Whether the request hit the `timeout` threshold |
| `db.opensearch.shards.total` | number | `5` | Total number of shards the request was executed against |
| `db.opensearch.shards.successful` | number | `5` | Number of shards that responded successfully |
| `db.opensearch.shards.failed` | number | `0` | Number of shards that failed |
| `db.opensearch.hits.total` | number | `42` | Total number of matching documents |

#### Conditionally present

These attributes only appear when specific conditions are met, either because OpenSearch omits them by default or because they require the query to opt in.

| Attribute | Type | Condition | When to use |
|---|---|---|---|
| `db.opensearch.shards.skipped` | number | Present when OpenSearch skips shards, e.g. when using `_routing` or shard-level filtering | Useful for verifying that routing is working as intended — a high skipped count means fewer shards are doing work |
| `db.opensearch.terminated_early` | boolean | Present when the query includes `terminate_after: N` in the request body | Use `terminate_after` when you want to cap result collection for performance reasons (e.g. existence checks). The attribute tells you whether the cap was actually hit |
| `db.opensearch.phase_took.*` | number | Present when the request uses `search_type: 'dfs_query_then_fetch'` | Use DFS search type when accurate relevance scoring across shards matters (e.g. small indices or cross-shard ranking). The phase breakdown lets you identify which phase dominates latency |

To enable `phase_took`, set `search_type` on the request:

```ts
client.search({
  index: 'my_index',
  search_type: 'dfs_query_then_fetch',
  body: { query: { ... } },
})
```

To enable `terminated_early`, set `terminate_after` in the query body:

```ts
client.search({
  index: 'my_index',
  body: {
    terminate_after: 1000,
    query: { ... },
  },
})
```

#### `db.opensearch.phase_took.*` fields

| Attribute | Description |
|---|---|
| `db.opensearch.phase_took.can_match` | Time spent determining which shards can match the query |
| `db.opensearch.phase_took.dfs_pre_query` | Time spent collecting term statistics across shards before the query phase |
| `db.opensearch.phase_took.dfs_query` | Time spent executing the query using globally collected term statistics |
| `db.opensearch.phase_took.expand` | Time spent expanding results (e.g. for collapse/inner hits) |
| `db.opensearch.phase_took.fetch` | Time spent fetching document source and fields |
| `db.opensearch.phase_took.query` | Time spent in the standard query phase |
