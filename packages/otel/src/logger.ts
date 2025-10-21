import { context, trace } from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import { LOG_SEVERITY_MAP, type LOG_SEVERITY_NAME } from './consts'
import { detectTelemetryContext } from './otel-context'

// biome-ignore lint/suspicious/noExplicitAny: library
type Attrs = Record<string, any>

export function getLogger(serviceOverride?: string, extraAttrs: Attrs = {}) {
  const { systemName, systemVersion, resourceAttributes } =
    detectTelemetryContext(serviceOverride)

  const defaultAttrs = {
    ...resourceAttributes,
    ...extraAttrs,
  }

  function emit(
    severityText: LOG_SEVERITY_NAME,
    body: string,
    attrs: Attrs = {}
  ) {
    // Get the logger at the last second
    const logger = logs.getLogger(systemName, systemVersion)

    const span = trace.getSpan(context.active())
    const spanContext = span?.spanContext()

    logger.emit({
      severityText,
      severityNumber: LOG_SEVERITY_MAP[severityText],
      body,
      attributes: {
        ...defaultAttrs,
        ...(spanContext && {
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId,
        }),
        ...attrs,
      },
    })
  }

  return {
    debug: (msg: string, attrs?: Attrs) => emit('DEBUG', msg, attrs),
    info: (msg: string, attrs?: Attrs) => emit('INFO', msg, attrs),
    notice: (msg: string, attrs?: Attrs) => emit('NOTICE', msg, attrs),
    warn: (msg: string, attrs?: Attrs) => emit('WARNING', msg, attrs),
    error: (
      msg: string | Error,
      errOrAttrs?: Error | Attrs,
      maybeAttrs: Attrs = {}
    ) => {
      let body: string
      let attrs: Attrs

      if (errOrAttrs instanceof Error) {
        body = `${msg}: ${errOrAttrs.stack || errOrAttrs.message}`
        attrs = maybeAttrs
      } else {
        body = msg instanceof Error ? msg.stack || msg.message : msg
        attrs = errOrAttrs || {}
      }

      emit('ERROR', body, attrs)
    },
    critical: (msg: string, attrs?: Attrs) => emit('CRITICAL', msg, attrs),
    alert: (msg: string, attrs?: Attrs) => emit('ALERT', msg, attrs),
    emergency: (msg: string, attrs?: Attrs) => emit('EMERGENCY', msg, attrs),
  }
}
