import Transport, {
  type ApiError,
} from '@opensearch-project/opensearch/lib/Transport.js'
import {
  context,
  type Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api'
import { isTracingSuppressed } from '@opentelemetry/core'
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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { OpenSearchInstrumentationConfig } from './index'
import { OpenSearchInstrumentation } from './index'

// ---------- Test helpers ----------

const mockResponse = {
  body: { hits: { hits: [] } },
  statusCode: 200,
  headers: {},
  warnings: null,
  meta: {
    connection: { url: new URL('http://localhost:9200') },
  } as any,
}

function setup(config?: OpenSearchInstrumentationConfig) {
  const exporter = new InMemorySpanExporter()
  const provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  })
  provider.register()

  // Install mock as the "original" BEFORE instrumentation wraps it,
  // so the wrapper calls our mock as the real implementation.
  const original = vi.fn().mockResolvedValue(mockResponse)
  Transport.prototype.request = original

  const instrumentation = new OpenSearchInstrumentation(config)
  instrumentation.setTracerProvider(provider)
  instrumentation.enable()

  const transport = new (Transport as any)({})

  return {
    transport,
    exporter,
    original,
    async teardown() {
      instrumentation.disable()
      await provider.shutdown()
    },
  }
}

// ---------- Tests ----------

describe('OpenSearchInstrumentation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('span name', () => {
    it('combines operation and index: "search my_index"', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(exporter.getFinishedSpans()[0].name).toBe('search my_index')
      await teardown()
    })

    it('uses only operation when path has no index: "bulk"', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/_bulk' })
      expect(exporter.getFinishedSpans()[0].name).toBe('bulk')
      await teardown()
    })

    it('falls back to raw path when no operation can be parsed', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'GET', path: '/' })
      expect(exporter.getFinishedSpans()[0].name).toBe('/')
      await teardown()
    })
  })

  describe('span attributes', () => {
    it('sets db.system = "opensearch"', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_DB_SYSTEM_NAME]
      ).toBe('opensearch')
      await teardown()
    })

    it('sets db.operation from the path', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_DB_OPERATION_NAME]
      ).toBe('search')
      await teardown()
    })

    it('sets db.opensearch.index from the path', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(
        exporter.getFinishedSpans()[0].attributes['db.opensearch.index']
      ).toBe('my_index')
      await teardown()
    })

    it('sets db.statement by serializing the body object', async () => {
      const { transport, exporter, teardown } = setup()
      const body = { query: { match_all: {} } }
      await transport.request({
        method: 'POST',
        path: '/my_index/_search',
        body,
      })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_DB_QUERY_TEXT]
      ).toBe(JSON.stringify(body))
      await teardown()
    })

    it('sets db.statement when body is already a string', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({
        method: 'POST',
        path: '/my_index/_search',
        body: '{"query":{}}',
      })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_DB_QUERY_TEXT]
      ).toBe('{"query":{}}')
      await teardown()
    })

    it('omits db.statement when body is absent', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'GET', path: '/my_index/_doc/123' })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_DB_QUERY_TEXT]
      ).toBeUndefined()
      await teardown()
    })
  })

  describe('configuration: dbStatementSerializer', () => {
    it('omits db.statement when set to false', async () => {
      const { transport, exporter, teardown } = setup({
        dbStatementSerializer: false,
      })
      await transport.request({
        method: 'POST',
        path: '/my_index/_search',
        body: { query: {} },
      })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_DB_QUERY_TEXT]
      ).toBeUndefined()
      await teardown()
    })

    it('uses a custom serializer function when provided', async () => {
      const { transport, exporter, teardown } = setup({
        dbStatementSerializer: () => 'redacted',
      })
      await transport.request({
        method: 'POST',
        path: '/my_index/_search',
        body: { query: {} },
      })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_DB_QUERY_TEXT]
      ).toBe('redacted')
      await teardown()
    })
  })

  describe('configuration: requestHook', () => {
    it('calls requestHook with span and params, allowing custom attributes', async () => {
      const { transport, exporter, teardown } = setup({
        requestHook: (span, params) => {
          span.setAttribute('custom.method', params.method)
        },
      })
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(exporter.getFinishedSpans()[0].attributes['custom.method']).toBe(
        'POST'
      )
      await teardown()
    })
  })

  describe('span kind and lifecycle', () => {
    it('creates a CLIENT span', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(exporter.getFinishedSpans()[0].kind).toBe(SpanKind.CLIENT)
      await teardown()
    })

    it('ends the span after the promise resolves', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(exporter.getFinishedSpans()[0].ended).toBe(true)
      await teardown()
    })

    it('sets ERROR status and records exception on failure', async () => {
      const { transport, exporter, original, teardown } = setup()
      const error = new Error('connection refused')
      original.mockRejectedValue(error)

      await expect(
        transport.request({ method: 'POST', path: '/my_index/_search' })
      ).rejects.toThrow('connection refused')

      const span = exporter.getFinishedSpans()[0]
      expect(span.status.code).toBe(SpanStatusCode.ERROR)
      expect(span.events[0].name).toBe('exception')
      await teardown()
    })
  })

  describe('context propagation', () => {
    it('sets the db span as active context inside the call by default', async () => {
      const { transport, original, exporter, teardown } = setup()
      let innerSpan: ReturnType<typeof trace.getSpan> | undefined

      original.mockImplementation(async () => {
        innerSpan = trace.getSpan(context.active())
        return mockResponse
      })

      await transport.request({ method: 'POST', path: '/my_index/_search' })

      expect(innerSpan).toBe(exporter.getFinishedSpans()[0])
      await teardown()
    })

    it('does not suppress tracing by default, allowing HTTP child spans', async () => {
      const { transport, original, teardown } = setup()
      let suppressedInsideCall = true

      original.mockImplementation(async () => {
        suppressedInsideCall = isTracingSuppressed(context.active())
        return mockResponse
      })

      await transport.request({ method: 'POST', path: '/my_index/_search' })

      expect(suppressedInsideCall).toBe(false)
      await teardown()
    })

    it('suppresses tracing when suppressInternalInstrumentation is true', async () => {
      const { transport, original, teardown } = setup({
        suppressInternalInstrumentation: true,
      })
      let suppressedInsideCall = false

      original.mockImplementation(async () => {
        suppressedInsideCall = isTracingSuppressed(context.active())
        return mockResponse
      })

      await transport.request({ method: 'POST', path: '/my_index/_search' })

      expect(suppressedInsideCall).toBe(true)
      await teardown()
    })

    it('does not set db span as active when suppressInternalInstrumentation is true', async () => {
      const { transport, original, teardown } = setup({
        suppressInternalInstrumentation: true,
      })
      let innerContext: ReturnType<typeof context.active> | undefined

      original.mockImplementation(async () => {
        innerContext = context.active()
        return mockResponse
      })

      await transport.request({ method: 'POST', path: '/my_index/_search' })

      expect(trace.getSpan(innerContext!)).toBeUndefined()
      await teardown()
    })
  })

  describe('configuration: responseHook', () => {
    it('calls responseHook with span and response on success', async () => {
      let hookSpan: Span | undefined
      let hookResponse: unknown

      const { transport, teardown } = setup({
        responseHook: (span, response) => {
          hookSpan = span
          hookResponse = response
        },
      })

      await transport.request({ method: 'POST', path: '/my_index/_search' })

      expect(hookSpan).toBeDefined()
      expect(hookResponse).toBe(mockResponse)
      await teardown()
    })

    it('can set custom span attributes from the response', async () => {
      const { transport, exporter, teardown } = setup({
        responseHook: (span, response) => {
          span.setAttribute(
            'custom.status',
            (response as typeof mockResponse).statusCode
          )
        },
      })

      await transport.request({ method: 'POST', path: '/my_index/_search' })

      expect(exporter.getFinishedSpans()[0].attributes['custom.status']).toBe(
        200
      )
      await teardown()
    })

    it('does not call responseHook on failure', async () => {
      let hookCalled = false
      const { transport, original, teardown } = setup({
        responseHook: () => {
          hookCalled = true
        },
      })
      original.mockRejectedValue(new Error('connection refused'))

      await expect(
        transport.request({ method: 'POST', path: '/my_index/_search' })
      ).rejects.toThrow()

      expect(hookCalled).toBe(false)
      await teardown()
    })
  })

  describe('configuration: moduleVersionAttributeName', () => {
    it('sets the named attribute with the opensearch client version', async () => {
      const { transport, exporter, teardown } = setup({
        moduleVersionAttributeName: 'db.opensearch.client.version',
      })

      await transport.request({ method: 'POST', path: '/my_index/_search' })

      const value =
        exporter.getFinishedSpans()[0].attributes[
          'db.opensearch.client.version'
        ]
      expect(typeof value).toBe('string')
      expect(value).toMatch(/^\d+\.\d+\.\d+/)
      await teardown()
    })
  })

  describe('server attributes', () => {
    it('sets server.address from the connection url', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_SERVER_ADDRESS]
      ).toBe('localhost')
      await teardown()
    })

    it('sets server.port from the connection url', async () => {
      const { transport, exporter, teardown } = setup()
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(exporter.getFinishedSpans()[0].attributes[ATTR_SERVER_PORT]).toBe(
        9200
      )
      await teardown()
    })

    it('omits server.port when the url uses the default port', async () => {
      const { transport, exporter, original, teardown } = setup()
      original.mockResolvedValue({
        ...mockResponse,
        meta: { connection: { url: new URL('http://localhost') } } as any,
      })
      await transport.request({ method: 'POST', path: '/my_index/_search' })
      expect(
        exporter.getFinishedSpans()[0].attributes[ATTR_SERVER_PORT]
      ).toBeUndefined()
      await teardown()
    })
  })

  describe('callback style', () => {
    it('ends the span and invokes the callback on success', async () => {
      const { transport, exporter, original, teardown } = setup()
      original.mockImplementation(
        (
          _params: unknown,
          _options: unknown,
          cb: (err: null, res: typeof mockResponse) => void
        ) => {
          cb(null, mockResponse)
          return { abort: () => {} }
        }
      )

      await new Promise<void>((resolve, reject) => {
        transport.request(
          { method: 'POST', path: '/my_index/_search' },
          undefined,
          (err: ApiError) => {
            err ? reject(err) : resolve()
          }
        )
      })

      expect(exporter.getFinishedSpans()[0].ended).toBe(true)
      await teardown()
    })

    it('sets ERROR status and invokes the callback on failure', async () => {
      const { transport, exporter, original, teardown } = setup()
      const error = new Error('connection refused')
      original.mockImplementation(
        (_params: unknown, _options: unknown, cb: (err: Error) => void) => {
          cb(error)
          return { abort: () => {} }
        }
      )

      const receivedErr = await new Promise<unknown>((resolve) => {
        transport.request(
          { method: 'POST', path: '/my_index/_search' },
          undefined,
          (err: ApiError) => resolve(err)
        )
      })

      expect(receivedErr).toBe(error)
      expect(exporter.getFinishedSpans()[0].status.code).toBe(
        SpanStatusCode.ERROR
      )
      await teardown()
    })
  })

  describe('disable', () => {
    it('restores the original Transport.prototype.request', () => {
      const { original, teardown } = setup()
      expect(Transport.prototype.request).not.toBe(original)
      teardown()
      expect(Transport.prototype.request).toBe(original)
    })
  })
})
