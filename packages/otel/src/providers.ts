import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import type { Resource } from '@opentelemetry/resources'
import {
  BatchLogRecordProcessor,
  LoggerProvider,
  type LogRecordProcessor,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import { ConsoleMetricPrettyExporter } from './loggers/console-metric-pretty-exporter'
import {
  ConsoleLogPrettyExporter,
  ConsoleSpanPrettyExporter,
} from './loggers/index'
import { TreeSpanProcessor } from './loggers/tree-span-processor'

export const getLogProvider = (
  resource: Resource,
  otlpEndpoint: string | undefined
) => {
  // With collector
  if (otlpEndpoint) {
    const exporter = new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs` })
    const processors: LogRecordProcessor[] = [
      new BatchLogRecordProcessor(exporter),
    ]

    // Console logging for cluster
    if (process.env.LOG_LEVEL) {
      const consoleExporter = new ConsoleLogPrettyExporter()
      processors.push(new SimpleLogRecordProcessor(consoleExporter))
    }

    return new LoggerProvider({
      resource,
      processors,
    })
  }

  // Local dev
  const exporter = new ConsoleLogPrettyExporter()
  const processor = new SimpleLogRecordProcessor(exporter)
  return new LoggerProvider({
    resource,
    processors: [processor],
  })
}

export const getSpanProcessor = (
  otlpEndpoint: string | undefined
): SpanProcessor => {
  const exporter = otlpEndpoint
    ? new OTLPTraceExporter({
        url: `${otlpEndpoint}/v1/traces`,
      })
    : new ConsoleSpanPrettyExporter()

  if (!otlpEndpoint) {
    return new TreeSpanProcessor(exporter)
  }

  if (process.env.OTEL_SIMPLE_SPAN_PROCESSOR === 'true') {
    console.log(
      '[otel] Using SimpleSpanProcessor (OTEL_SIMPLE_SPAN_PROCESSOR=true)'
    )
    return new SimpleSpanProcessor(exporter)
  }

  return new BatchSpanProcessor(exporter)
}

export const getMetricReader = (otlpEndpoint: string | undefined) => {
  const metricExporter = otlpEndpoint
    ? new OTLPMetricExporter({
        url: `${otlpEndpoint}/v1/metrics`,
      })
    : new ConsoleMetricPrettyExporter()
  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
  })

  return metricReader
}
