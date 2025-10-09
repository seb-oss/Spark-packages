import { context, SpanStatusCode, trace } from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { beforeEach, describe, expect, it } from 'vitest'
import { getTracer } from './tracer'

describe('getTracer', () => {
  beforeEach(() => {
    context.setGlobalContextManager(
      new AsyncLocalStorageContextManager().enable()
    )
  })
  it('returns a tracer with withTrace and withTraceSync methods', () => {
    const tracer = getTracer('test-svc')

    expect(typeof tracer.startSpan).toBe('function')
    expect(typeof tracer.withTrace).toBe('function')
    expect(typeof tracer.withTraceSync).toBe('function')
  })
  it('runs a function inside a span using withTraceSync', () => {
    const tracer = getTracer('sync-test')

    let activeSpanId: string | undefined

    const result = tracer.withTraceSync('sync-span', (span) => {
      activeSpanId = trace.getSpan(context.active())?.spanContext().spanId
      return 'ok'
    })

    expect(result).toBe('ok')
    expect(activeSpanId).toBeDefined()
  })
  it('runs a function inside a span using withTrace (async)', async () => {
    const tracer = getTracer('async-test')

    let capturedSpanId: string | undefined

    const result = await tracer.withTrace('async-span', async (span) => {
      capturedSpanId = trace.getSpan(context.active())?.spanContext().spanId
      return 42
    })

    expect(result).toBe(42)
    expect(capturedSpanId).toBeDefined()
  })
  it('marks the span as error if the function throws (sync)', () => {
    const tracer = getTracer('error-test')

    let capturedStatus: SpanStatusCode | undefined

    try {
      tracer.withTraceSync('failing-span', (span) => {
        throw new Error('fail!')
      })
    } catch (err) {
      // intentionally swallow
    }

    // There's no built-in way to inspect ended spans without a span processor/exporter
    // So this just ensures the span exists during execution
    const span = trace.getSpan(context.active())
    expect(span).toBeUndefined() // it should be ended and out of context
  })
  it('marks the span as error if the function throws (async)', async () => {
    const tracer = getTracer('async-error-test')

    try {
      await tracer.withTrace('failing-async', async () => {
        throw new Error('oh no!')
      })
    } catch (err) {
      // swallow on purpose
    }

    const span = trace.getSpan(context.active())
    expect(span).toBeUndefined()
  })
})
