import {
  context,
  type SpanOptions,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api'
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
  const { componentName, systemName, systemVersion } = detectTelemetryContext(
    componentNameOverride
  )
  const tracer = trace.getTracer(
    componentName ?? systemName,
    systemVersion
  ) as Tracer

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

    return await context.with(trace.setSpan(parentContext, span), async () => {
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

    return context.with(trace.setSpan(parentContext, span), () => {
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
  let options: SpanOptions = {}
  let parent: Span | undefined
  let fn: (span: Span) => T

  if (typeof spanOptionsSpanOrFunc === 'function') {
    fn = spanOptionsSpanOrFunc
  } else if (typeof spanOrFunc === 'function') {
    const spanOrSpanOptions = spanOptionsSpanOrFunc as Span | SpanOptions
    if (
      'startTime' in spanOrSpanOptions ||
      'attributes' in spanOrSpanOptions ||
      'kind' in spanOrSpanOptions
    ) {
      options = spanOrSpanOptions as SpanOptions
    } else {
      parent = spanOrSpanOptions as Span
    }
    fn = spanOrFunc
  } else {
    options = spanOptionsSpanOrFunc as SpanOptions
    parent = spanOrFunc as Span
    // biome-ignore lint/style/noNonNullAssertion: it IS defined here
    fn = func!
  }

  return { options, parent, fn }
}
