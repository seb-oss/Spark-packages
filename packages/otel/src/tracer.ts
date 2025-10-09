import {
  context,
  type SpanOptions,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api'
import { detectTelemetryContext } from './otel-context'

type OtelTracer = ReturnType<typeof trace.getTracer>
type Span = ReturnType<OtelTracer['startSpan']>

type Func<T> = (span?: Span) => Promise<T> | T
type SyncFunc<T> = (span?: Span) => T

type WithTrace = {
  <T>(name: string, fn: Func<T>): Promise<T>
  <T>(name: string, options: SpanOptions, fn: Func<T>): Promise<T>
}
type WithTraceSync = {
  <T>(name: string, fn: SyncFunc<T>): T
  <T>(name: string, options: SpanOptions, fn: SyncFunc<T>): T
}

/**
 * Extended tracer with helper methods for span-wrapped execution
 */
interface Tracer extends OtelTracer {
  withTrace: WithTrace
  withTraceSync: WithTraceSync
}

/**
 * Returns an OpenTelemetry tracer bound to the current service.
 * Includes `withTrace()` and `withTraceSync()` helpers for span-wrapped execution.
 *
 * @param serviceOverride - Optional override for service name
 * @returns Tracer with helpers
 */
export function getTracer(serviceOverride?: string): Tracer {
  const { serviceName } = detectTelemetryContext(serviceOverride)
  const tracer = trace.getTracer(serviceName) as Tracer

  /**
   * Runs a function inside a new span (async variant).
   * Automatically handles span status and nesting.
   */
  const withTrace: WithTrace = async <T>(
    name: string,
    optionsOrFn: SpanOptions | Func<T>,
    maybeFn?: Func<T>
  ): Promise<T> => {
    const options: SpanOptions =
      typeof maybeFn === 'function' ? (optionsOrFn as SpanOptions) : {}
    const fn: Func<T> =
      typeof maybeFn === 'function' ? maybeFn : (optionsOrFn as Func<T>)

    // Auto-nesting: span is parented if another is active
    const ctx = context.active()
    const span = tracer.startSpan(name, options, ctx)

    return await context.with(trace.setSpan(ctx, span), async () => {
      try {
        const result = await fn(span)
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (err) {
        const error = err as Error
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
        span.recordException?.(error)
        throw err
      } finally {
        span.end()
      }
    })
  }

  /**
   * Runs a synchronous function inside a new span.
   * Automatically handles span status and nesting.
   */
  const withTraceSync: WithTraceSync = <T>(
    name: string,
    optionsOrFn: SpanOptions | SyncFunc<T>,
    maybeFn?: SyncFunc<T>
  ): T => {
    const options: SpanOptions =
      typeof maybeFn === 'function' ? (optionsOrFn as SpanOptions) : {}
    const fn: SyncFunc<T> =
      typeof maybeFn === 'function' ? maybeFn : (optionsOrFn as SyncFunc<T>)

    const ctx = context.active()
    const span = tracer.startSpan(name, options, ctx)

    return context.with(trace.setSpan(ctx, span), () => {
      try {
        const result = fn(span)
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (err) {
        const error = err as Error
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
        span.recordException?.(error)
        throw err
      } finally {
        span.end()
      }
    })
  }

  tracer.withTrace = withTrace
  tracer.withTraceSync = withTraceSync

  return tracer
}
