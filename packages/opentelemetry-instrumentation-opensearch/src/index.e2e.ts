import { Client } from '@opensearch-project/opensearch'
import { SpanKind, SpanStatusCode } from '@opentelemetry/api'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import {
  ATTR_DB_COLLECTION_NAME,
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_QUERY_TEXT,
  ATTR_DB_SYSTEM_NAME,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
} from '@opentelemetry/semantic-conventions'
import {
  OpenSearchContainer,
  type StartedOpenSearchContainer,
} from '@testcontainers/opensearch'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { OpenSearchInstrumentation } from './index'

let container: StartedOpenSearchContainer
let client: Client
let exporter: InMemorySpanExporter
let provider: NodeTracerProvider

beforeAll(async () => {
  container = await new OpenSearchContainer(
    'opensearchproject/opensearch:2.18.0'
  )
    .withSecurityEnabled(false)
    .start()

  exporter = new InMemorySpanExporter()
  provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  })
  provider.register()

  const instrumentation = new OpenSearchInstrumentation()
  instrumentation.setTracerProvider(provider)
  instrumentation.enable()

  client = new Client({ node: container.getHttpUrl() })
}, 120_000)

afterAll(async () => {
  await provider.shutdown()
  await container.stop()
})

describe('OpenSearchInstrumentation e2e', () => {
  const index = 'test_index'

  it('creates a CLIENT span for index creation', async () => {
    exporter.reset()
    await client.indices.create({ index })
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === `indices.create ${index}`)
    expect(span).toBeDefined()
    expect(span!.kind).toBe(SpanKind.CLIENT)
    expect(span!.attributes).toMatchObject({
      [ATTR_DB_SYSTEM_NAME]: 'opensearch',
      [ATTR_DB_OPERATION_NAME]: 'indices.create',
      [ATTR_DB_COLLECTION_NAME]: index,
    })
  })

  it('creates a CLIENT span for document indexing', async () => {
    exporter.reset()
    const body = { name: 'Alice', age: 30 }
    await client.index({ index, body, refresh: true })
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === `index ${index}`)
    expect(span).toBeDefined()
    expect(span!.attributes).toMatchObject({
      [ATTR_DB_SYSTEM_NAME]: 'opensearch',
      [ATTR_DB_OPERATION_NAME]: 'index',
      [ATTR_DB_COLLECTION_NAME]: index,
      [ATTR_DB_QUERY_TEXT]: JSON.stringify(body),
    })
  })

  it('creates a CLIENT span for search with correct span name and attributes', async () => {
    exporter.reset()
    const body = { query: { match_all: {} } }
    await client.search({ index, body })
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span).toBeDefined()
    expect(span!.kind).toBe(SpanKind.CLIENT)
    expect(span!.attributes).toMatchObject({
      [ATTR_DB_SYSTEM_NAME]: 'opensearch',
      [ATTR_DB_OPERATION_NAME]: 'search',
      [ATTR_DB_COLLECTION_NAME]: index,
      [ATTR_DB_QUERY_TEXT]: JSON.stringify(body),
    })
  })

  it('omits db.query.text for a bodyless search', async () => {
    exporter.reset()
    await client.search({ index })
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span).toBeDefined()
    expect(span!.attributes[ATTR_DB_QUERY_TEXT]).toBeUndefined()
  })

  it('records opensearch execution stats on the span', async () => {
    exporter.reset()
    await client.index({ index, body: { name: 'stats-doc' }, refresh: true })
    await client.search({ index, body: { query: { match_all: {} } } })
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span!.attributes).toMatchObject({
      [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
      'db.opensearch.timed_out': false,
      'db.opensearch.shards.failed': 0,
    })
    expect(span!.attributes['db.opensearch.took']).toBeGreaterThanOrEqual(0)
    expect(span!.attributes['db.opensearch.shards.total']).toBeGreaterThan(0)
    expect(span!.attributes['db.opensearch.shards.successful']).toBeGreaterThan(
      0
    )
    expect(span!.attributes['db.opensearch.hits.total']).toBeGreaterThan(0)
  })

  it('sets server.address and server.port on the span', async () => {
    exporter.reset()
    await client.search({ index, body: { query: { match_all: {} } } })
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span!.attributes).toMatchObject({
      [ATTR_SERVER_ADDRESS]: container.getHost(),
      [ATTR_SERVER_PORT]: container.getMappedPort(9200),
    })
  })

  it('creates a CLIENT span for bulk with no index attribute', async () => {
    exporter.reset()
    await client.bulk({
      body: [{ index: { _index: index } }, { name: 'Bob', age: 25 }],
    })
    const span = exporter.getFinishedSpans().find((s) => s.name === 'bulk')
    expect(span).toBeDefined()
    expect(span!.attributes).toMatchObject({ [ATTR_DB_OPERATION_NAME]: 'bulk' })
    expect(span!.attributes[ATTR_DB_COLLECTION_NAME]).toBeUndefined()
  })

  it('sets ERROR status and records exception on a failed request', async () => {
    exporter.reset()
    await expect(
      client.search({
        index: 'nonexistent_index',
        body: { query: { match_all: {} } },
      })
    ).rejects.toThrow()
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === 'search nonexistent_index')
    expect(span).toBeDefined()
    expect(span!.status.code).toBe(SpanStatusCode.ERROR)
    expect(span!.events[0].name).toBe('exception')
  })

  it('omits db.query.text when dbStatementSerializer is false', async () => {
    const localExporter = new InMemorySpanExporter()
    const localProvider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(localExporter)],
    })
    localProvider.register()
    const instrumentation = new OpenSearchInstrumentation({
      dbStatementSerializer: false,
    })
    instrumentation.setTracerProvider(localProvider)
    instrumentation.enable()

    const localClient = new Client({ node: container.getHttpUrl() })
    await localClient.search({ index, body: { query: { match_all: {} } } })

    const span = localExporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span!.attributes[ATTR_DB_QUERY_TEXT]).toBeUndefined()

    instrumentation.disable()
    await localProvider.shutdown()
  })

  it('calls requestHook and attaches custom attributes', async () => {
    const localExporter = new InMemorySpanExporter()
    const localProvider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(localExporter)],
    })
    localProvider.register()
    const instrumentation = new OpenSearchInstrumentation({
      requestHook: (span, params) => {
        span.setAttribute('custom.method', params.method)
      },
    })
    instrumentation.setTracerProvider(localProvider)
    instrumentation.enable()

    const localClient = new Client({ node: container.getHttpUrl() })
    await localClient.search({ index, body: { query: { match_all: {} } } })

    const span = localExporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span!.attributes['custom.method']).toBe('POST')

    instrumentation.disable()
    await localProvider.shutdown()
  })

  it('calls responseHook with the real response and allows setting custom attributes', async () => {
    const localExporter = new InMemorySpanExporter()
    const localProvider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(localExporter)],
    })
    localProvider.register()
    const instrumentation = new OpenSearchInstrumentation({
      responseHook: (span, response) => {
        if (response.statusCode != null)
          span.setAttribute('custom.status_code', response.statusCode)
      },
    })
    instrumentation.setTracerProvider(localProvider)
    instrumentation.enable()

    const localClient = new Client({ node: container.getHttpUrl() })
    await localClient.search({ index, body: { query: { match_all: {} } } })

    const span = localExporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span!.attributes['custom.status_code']).toBe(200)

    instrumentation.disable()
    await localProvider.shutdown()
  })

  it('does not produce an HTTP child span inside the db span', async () => {
    exporter.reset()
    await client.search({ index, body: { query: { match_all: {} } } })
    const httpSpans = exporter
      .getFinishedSpans()
      .filter((s) => s.instrumentationScope.name.includes('http'))
    expect(httpSpans).toHaveLength(0)
  })

  it('captures db.query.text when http instrumentation is registered alongside opensearch instrumentation', async () => {
    const localExporter = new InMemorySpanExporter()
    const localProvider = new NodeTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(localExporter)],
    })
    localProvider.register()

    const httpInstrumentation = new HttpInstrumentation()
    httpInstrumentation.setTracerProvider(localProvider)
    httpInstrumentation.enable()

    const undiciInstrumentation = new UndiciInstrumentation()
    undiciInstrumentation.setTracerProvider(localProvider)
    undiciInstrumentation.enable()

    const instrumentation = new OpenSearchInstrumentation()
    instrumentation.setTracerProvider(localProvider)
    instrumentation.enable()

    const localClient = new Client({ node: container.getHttpUrl() })
    const body = { query: { match_all: {} } }
    await localClient.search({ index, body })

    const span = localExporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span!.attributes[ATTR_DB_QUERY_TEXT]).toBe(JSON.stringify(body))

    httpInstrumentation.disable()
    undiciInstrumentation.disable()
    instrumentation.disable()
    await localProvider.shutdown()
  })

  it('instrumentation does not break opensearch responses — indexed document is returned by search', async () => {
    const functionalIndex = 'functional_test_index'
    await client.indices.create({ index: functionalIndex })
    const doc = { title: 'hello world', value: 42 }
    await client.index({ index: functionalIndex, body: doc, refresh: true })

    const result = await client.search({
      index: functionalIndex,
      body: { query: { match: { title: 'hello world' } } },
    })

    expect(result.statusCode).toBe(200)
    const hits = result.body.hits.hits as unknown as Array<{
      _source: typeof doc
    }>
    expect(hits).toHaveLength(1)
    expect(hits[0]._source).toMatchObject(doc)
  })
})
