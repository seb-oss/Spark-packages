import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import type { Resource } from '@opentelemetry/resources'
import {
  BatchLogRecordProcessor,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import {
  BatchSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-node'
import { ConsoleLogPrettyExporter, ConsoleSpanPrettyExporter } from './loggers'
import { ConsoleMetricPrettyExporter } from './loggers/console-metric-pretty-exporter'
import { TreeSpanProcessor } from './loggers/tree-span-processor'

export const getLogProvider = (
  resource: Resource,
  otlpEndpoint: string | undefined
) => {
  const exporter = otlpEndpoint
    ? new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs` })
    : new ConsoleLogPrettyExporter()

  const processor = otlpEndpoint
    ? new BatchLogRecordProcessor(exporter)
    : new SimpleLogRecordProcessor(exporter)

  const provider = new LoggerProvider({
    resource,
    processors: [processor],
  })

  return provider
}

export const getSpanProcessor = (
  otlpEndpoint: string | undefined
): SpanProcessor => {
  const exporter = otlpEndpoint
    ? new OTLPTraceExporter({
        url: `${otlpEndpoint}/v1/traces`,
      })
    : new ConsoleSpanPrettyExporter()
  const processor = otlpEndpoint
    ? new BatchSpanProcessor(exporter)
    : new TreeSpanProcessor(exporter)

  return processor
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
