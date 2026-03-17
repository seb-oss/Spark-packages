import { context, trace } from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import { LOG_SEVERITY_MAP, type LOG_SEVERITY_NAME } from './consts'
import { isInitialized } from './otel'
import { detectTelemetryContext } from './otel-context'

// biome-ignore lint/suspicious/noExplicitAny: library
type Attrs = Record<string, any>

export type Logger = ReturnType<typeof getLogger>
export function getLogger(serviceOverride?: string, extraAttrs: Attrs = {}) {
  const { systemName, systemVersion, resourceAttributes } =
    detectTelemetryContext(serviceOverride)

  const defaultAttrs = {
    ...resourceAttributes,
    ...extraAttrs,
  }

  let hasWarnedAboutInit = false

  function emit(
    severityText: LOG_SEVERITY_NAME,
    body: string,
    attrs: Attrs = {}
  ) {
    // Get the logger at the last second
    if (!isInitialized() && process.env.NODE_ENV !== 'test') {
      if (!hasWarnedAboutInit) {
        console.warn('OTEL must be initialized before using logger')
        hasWarnedAboutInit = true
      }
      console.log(`[${severityText}] ${body}`)
      return
    }
    const logger = logs.getLogger(systemName, systemVersion)

    const span = trace.getSpan(context.active())
    const spanContext = span?.spanContext()

    logger.emit({
      severityText,
      severityNumber: LOG_SEVERITY_MAP[severityText],
      body,
      attributes: {
        'gcp.log_name': systemName.replace(/^@/, '').replace(/\//g, '-'),
        ...defaultAttrs,
        ...(spanContext && {
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId,
        }),
        ...attrs,
      },
    })
  }

  function resolveArgs(
    msg: string | Error,
    errOrAttrs?: Error | Attrs,
    maybeAttrs: Attrs = {}
  ): { body: string; attrs: Attrs } {
    if (errOrAttrs instanceof Error) {
      const body = `${msg}: ${errOrAttrs.stack || errOrAttrs.message}`
      return { body, attrs: maybeAttrs }
    }

    const body = msg instanceof Error ? msg.stack || msg.message : msg
    const attrs = errOrAttrs || {}
    return { body, attrs }
  }

  type LogFn = {
    (msg: string, attrs?: Attrs): void
    (msg: string, error: Error, attrs?: Attrs): void
    (error: Error, attrs?: Attrs): void
  }

  function createLogFn(severity: LOG_SEVERITY_NAME): LogFn {
    return (
      msg: string | Error,
      errOrAttrs?: Error | Attrs,
      maybeAttrs: Attrs = {}
    ) => {
      const { body, attrs } = resolveArgs(msg, errOrAttrs, maybeAttrs)
      emit(severity, body, attrs)
    }
  }

  return {
    debug: createLogFn('DEBUG'),
    info: createLogFn('INFO'),
    notice: createLogFn('NOTICE'),
    warn: createLogFn('WARN'),
    error: createLogFn('ERROR'),
    critical: createLogFn('CRITICAL'),
    alert: createLogFn('ALERT'),
    emergency: createLogFn('EMERGENCY'),
  }
}
