import { context, trace } from '@opentelemetry/api'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initialize } from './otel'
import { getTracer } from './tracer'

describe('getTracer', () => {
  it('warns if OTEL is not yet initialized', () => {
    process.env.NODE_ENV = 'not test'
    const warn = vi.spyOn(console, 'warn')

    expect(() => getTracer()).not.toThrow()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('OTEL must be initialized')
    )

    warn.mockRestore()
    process.env.NODE_ENV = 'test'
  })
  it('does not warn if NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test'
    const warn = vi.spyOn(console, 'warn')

    expect(() => getTracer()).not.toThrow()
    expect(warn).not.toHaveBeenCalled()

    warn.mockRestore()
  })
  describe('after initialize()', () => {
    beforeEach(async () => {
      await initialize()
      context.disable()
      context.setGlobalContextManager(
        new AsyncLocalStorageContextManager().enable()
      )
    })
    it('returns a tracer with withTrace and withTraceSync methods', async () => {
      const tracer = getTracer('test-svc')
      expect(typeof tracer.startSpan).toBe('function')
      expect(typeof tracer.withTrace).toBe('function')
      expect(typeof tracer.withTraceSync).toBe('function')
    })
    it('runs a function inside a span using withTraceSync', async () => {
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
    it('treats null second argument as absent (isSpanOptions returns false for null)', async () => {
      const tracer = getTracer('null-opts-test')
      const result = await tracer.withTrace(
        'null-opts',
        null as any,
        async () => 'ok'
      )
      expect(result).toBe('ok')
    })

    it('marks the span as error if the function throws (sync)', async () => {
      const tracer = getTracer('error-test')
      try {
        tracer.withTraceSync('failing-span', () => {
          throw new Error('fail!')
        })
      } catch {}
      const span = trace.getSpan(context.active())
      expect(span).toBeUndefined()
    })
    it('marks the span as error if the function throws (async)', async () => {
      const tracer = getTracer('async-error-test')
      try {
        await tracer.withTrace('failing-async', async () => {
          throw new Error('oh no!')
        })
      } catch {}
      const span = trace.getSpan(context.active())
      expect(span).toBeUndefined()
    })
    it('accepts span options only', async () => {
      const tracer = getTracer('opts-only')
      const result = await tracer.withTrace(
        'span-with-opts',
        { attributes: { foo: 'bar' } },
        async (span) => {
          return (span as any).attributes
        }
      )
      expect(result).toEqual({ foo: 'bar' })
    })
    it('accepts parent span only', async () => {
      const tracer = getTracer('parent-only')
      const parent = tracer.startSpan('parent')
      const result = await tracer.withTrace('child', parent, async (child) => {
        return child.spanContext().traceId === parent.spanContext().traceId
      })
      expect(result).toBe(true)
      parent.end()
    })
    it('accepts both span options and parent span', async () => {
      const tracer = getTracer('opts-parent')
      const parent = tracer.startSpan('parent')
      const result = await tracer.withTrace(
        'child',
        { attributes: { foo: 'bar' } },
        parent,
        async (child) => {
          return (child as any).attributes
        }
      )
      expect(result).toEqual({ foo: 'bar' })
      parent.end()
    })
    it('only calls span.end() once if the callback also calls span.end() (async)', async () => {
      const tracer = getTracer('double-end-async')
      let endCallCount = 0
      await tracer.withTrace('span', async (span) => {
        const original = span.end.bind(span)
        span.end = (...args) => {
          endCallCount++
          original(...args)
        }
        span.end()
      })
      expect(endCallCount).toBe(1)
    })
    it('only calls span.end() once if the callback also calls span.end() (sync)', () => {
      const tracer = getTracer('double-end-sync')
      let endCallCount = 0
      tracer.withTraceSync('span', (span) => {
        const original = span.end.bind(span)
        span.end = (...args) => {
          endCallCount++
          original(...args)
        }
        span.end()
      })
      expect(endCallCount).toBe(1)
    })
    it('sync version supports options and parent span', async () => {
      const tracer = getTracer('sync-mixed')
      const parent = tracer.startSpan('parent')
      const result = tracer.withTraceSync(
        'child',
        { attributes: { x: 1 } },
        parent,
        (child) => {
          return (child as any).attributes
        }
      )
      expect(result).toEqual({ x: 1 })
      parent.end()
    })
  })
})
