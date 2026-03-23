import { Client } from '@opensearch-project/opensearch'
import { SpanKind, SpanStatusCode } from '@opentelemetry/api'
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import {
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_QUERY_TEXT,
  ATTR_DB_SYSTEM_NAME,
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

  it('creates a CLIENT span for index creation (path has no _operation, falls back to raw path)', async () => {
    exporter.reset()
    await client.indices.create({ index })
    // PUT /test_index has no _operation segment, so the span name is the raw path
    const span = exporter.getFinishedSpans().find((s) => s.name === `/${index}`)
    expect(span).toBeDefined()
    expect(span!.kind).toBe(SpanKind.CLIENT)
    expect(span!.attributes[ATTR_DB_SYSTEM_NAME]).toBe('opensearch')
    expect(span!.attributes[ATTR_DB_OPERATION_NAME]).toBeUndefined()
    expect(span!.attributes['db.opensearch.index']).toBeUndefined()
  })

  it('creates a CLIENT span for document indexing', async () => {
    exporter.reset()
    const body = { name: 'Alice', age: 30 }
    await client.index({ index, body, refresh: true })
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === `doc ${index}`)
    expect(span).toBeDefined()
    expect(span!.attributes[ATTR_DB_SYSTEM_NAME]).toBe('opensearch')
    expect(span!.attributes[ATTR_DB_OPERATION_NAME]).toBe('doc')
    expect(span!.attributes['db.opensearch.index']).toBe(index)
    expect(span!.attributes[ATTR_DB_QUERY_TEXT]).toBe(JSON.stringify(body))
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
    expect(span!.attributes[ATTR_DB_SYSTEM_NAME]).toBe('opensearch')
    expect(span!.attributes[ATTR_DB_OPERATION_NAME]).toBe('search')
    expect(span!.attributes['db.opensearch.index']).toBe(index)
    expect(span!.attributes[ATTR_DB_QUERY_TEXT]).toBe(JSON.stringify(body))
  })

  it('sets server.address and server.port on the span', async () => {
    exporter.reset()
    await client.search({ index, body: { query: { match_all: {} } } })
    const span = exporter
      .getFinishedSpans()
      .find((s) => s.name === `search ${index}`)
    expect(span!.attributes[ATTR_SERVER_ADDRESS]).toBe(container.getHost())
    expect(span!.attributes[ATTR_SERVER_PORT]).toBe(
      container.getMappedPort(9200)
    )
  })

  it('creates a CLIENT span for bulk with no index attribute', async () => {
    exporter.reset()
    await client.bulk({
      body: [{ index: { _index: index } }, { name: 'Bob', age: 25 }],
    })
    const span = exporter.getFinishedSpans().find((s) => s.name === 'bulk')
    expect(span).toBeDefined()
    expect(span!.attributes[ATTR_DB_OPERATION_NAME]).toBe('bulk')
    expect(span!.attributes['db.opensearch.index']).toBeUndefined()
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
})
