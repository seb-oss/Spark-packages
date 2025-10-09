// src/logger.ts

import { context, trace } from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import { detectTelemetryContext } from './otel-context'

type Severity =
  | 'DEBUG'
  | 'INFO'
  | 'NOTICE'
  | 'WARNING'
  | 'ERROR'
  | 'CRITICAL'
  | 'ALERT'
  | 'EMERGENCY'

// biome-ignore lint/suspicious/noExplicitAny: library
type Attrs = Record<string, any>

export function getLogger(serviceOverride?: string, extraAttrs: Attrs = {}) {
  const { serviceName, serviceVersion, resourceAttributes } =
    detectTelemetryContext(serviceOverride)
  const logger = logs.getLogger(serviceName, serviceVersion, {})

  const defaultAttrs = {
    ...resourceAttributes,
    ...extraAttrs,
  }

  function emit(severityText: Severity, body: string, attrs: Attrs = {}) {
    const span = trace.getSpan(context.active())
    const spanContext = span?.spanContext()

    logger.emit({
      severityText,
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
    error: (msg: string | Error, attrs: Attrs = {}) => {
      const body = msg instanceof Error ? msg.stack || msg.message : msg
      emit('ERROR', body, attrs)
    },
    critical: (msg: string, attrs?: Attrs) => emit('CRITICAL', msg, attrs),
    alert: (msg: string, attrs?: Attrs) => emit('ALERT', msg, attrs),
    emergency: (msg: string, attrs?: Attrs) => emit('EMERGENCY', msg, attrs),
  }
}
