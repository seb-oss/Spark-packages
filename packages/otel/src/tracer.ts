import {
  context,
  type SpanOptions,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api'
import { isInitialized } from './otel'
import { detectTelemetryContext } from './otel-context'

type OtelTracer = ReturnType<typeof trace.getTracer>
type Span = ReturnType<OtelTracer['startSpan']>

type Func<T> = (span: Span) => Promise<T> | T
type SyncFunc<T> = (span: Span) => T

type WithTrace = {
  <T>(name: string, fn: Func<T>): Promise<T>
  <T>(name: string, options: SpanOptions, fn: Func<T>): Promise<T>
  <T>(name: string, parent: Span, fn: Func<T>): Promise<T>
  <T>(name: string, options: SpanOptions, parent: Span, fn: Func<T>): Promise<T>
}
type WithTraceSync = {
  <T>(name: string, fn: SyncFunc<T>): T
  <T>(name: string, options: SpanOptions, fn: SyncFunc<T>): T
  <T>(name: string, parent: Span, fn: SyncFunc<T>): T
  <T>(name: string, options: SpanOptions, parent: Span, fn: SyncFunc<T>): T
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
export function getTracer(componentNameOverride?: string): Tracer {
  if (!isInitialized() && process.env.NODE_ENV !== 'test') {
    console.warn('OTEL must be initialized before calling getTracer()')
  }

  const { componentName, systemName, systemVersion } = detectTelemetryContext(
    componentNameOverride
  )
  const tracer = trace.getTracer(componentName ?? systemName, systemVersion)

  /**
   * Runs a function inside a new span (async variant).
   * Automatically handles span status and nesting.
   */
  const withTrace: WithTrace = async <T>(
    name: string,
    spanOptionsSpanOrFunc?: SpanOptions | Span | Func<T>,
    spanOrFunc?: Span | Func<T>,
    func?: Func<T>
  ): Promise<T> => {
    const { options, parent, fn } = extractArgs(
      spanOptionsSpanOrFunc,
      spanOrFunc,
      func
    )

    const parentContext = parent
      ? trace.setSpan(context.active(), parent)
      : context.active()

    const span = tracer.startSpan(name, options, parentContext)
    let ended = false
    const originalEnd = span.end.bind(span)
    const endOnce = () => {
      if (!ended) {
        ended = true
        originalEnd()
      }
    }
    span.end = endOnce

    return await context.with(trace.setSpan(parentContext, span), async () => {
      try {
        const result = await fn(span)
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (err) {
        recordError(span, err)
        throw err
      } finally {
        endOnce()
      }
    })
  }

  /**
   * Runs a synchronous function inside a new span.
   * Automatically handles span status and nesting.
   */
  const withTraceSync: WithTraceSync = <T>(
    name: string,
    spanOptionsSpanOrFunc?: SpanOptions | Span | SyncFunc<T>,
    spanOrFunc?: Span | SyncFunc<T>,
    func?: SyncFunc<T>
  ): T => {
    const { options, parent, fn } = extractArgs(
      spanOptionsSpanOrFunc,
      spanOrFunc,
      func
    )

    const parentContext = parent
      ? trace.setSpan(context.active(), parent)
      : context.active()

    const span = tracer.startSpan(name, options, parentContext)
    let ended = false
    const originalEnd = span.end.bind(span)
    const endOnce = () => {
      if (!ended) {
        ended = true
        originalEnd()
      }
    }
    span.end = endOnce

    return context.with(trace.setSpan(parentContext, span), () => {
      try {
        const result = fn(span)
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (err) {
        recordError(span, err)
        throw err
      } finally {
        endOnce()
      }
    })
  }

  return Object.assign(tracer, { withTrace, withTraceSync })
}

const recordError = (span: Span, err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  span.setStatus({ code: SpanStatusCode.ERROR, message })
  span.recordException?.(err instanceof Error ? err : message)
}

type TraceArgs<T> = {
  options: SpanOptions
  parent?: Span
  fn: (span: Span) => T
}

function extractArgs<T>(
  spanOptionsSpanOrFunc?: SpanOptions | Span | ((span: Span) => T),
  spanOrFunc?: Span | ((span: Span) => T),
  func?: (span: Span) => T
): TraceArgs<T> {
  if (isFunction(spanOptionsSpanOrFunc)) {
    return { options: {}, fn: spanOptionsSpanOrFunc }
  }
  const options =
    spanOptionsSpanOrFunc && !isSpan(spanOptionsSpanOrFunc)
      ? spanOptionsSpanOrFunc
      : {}
  if (isFunction(spanOrFunc)) {
    const parent = isSpan(spanOptionsSpanOrFunc)
      ? spanOptionsSpanOrFunc
      : undefined
    return { options, parent, fn: spanOrFunc }
  }
  // biome-ignore lint/style/noNonNullAssertion: the overloads require fn last
  return { options, parent: spanOrFunc, fn: func! }
}

const isFunction = (value: unknown): value is (span: Span) => unknown =>
  typeof value === 'function'
const isSpan = (value: unknown): value is Span =>
  typeof value === 'object' &&
  value !== null &&
  'spanContext' in value &&
  isFunction(value.spanContext) &&
  'end' in value &&
  isFunction(value.end)
