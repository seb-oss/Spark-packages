import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import {
  detectResources,
  resourceFromAttributes,
} from '@opentelemetry/resources'
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'

// ------------------------------------------------------------
// Diagnostics (for troubleshooting instrumentation itself)
// ------------------------------------------------------------
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

// ------------------------------------------------------------
// Configurable values (env‑based)
// ------------------------------------------------------------
const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service'
const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318'

// ------------------------------------------------------------
// Exporters and metric reader
// ------------------------------------------------------------
const traceExporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`,
})
const metricExporter = new OTLPMetricExporter({
  url: `${otlpEndpoint}/v1/metrics`,
})
const logExporter = new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs` })
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
})

async function initialize() {
  // ------------------------------------------------------------
  // Async startup for resource detection and SDK init
  // ------------------------------------------------------------
  try {
    const baseRes = await detectResources()
    const customRes = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: '1.0.0',
    })
    const resource = baseRes.merge(customRes)

    // --- Logs setup (manual, separate from NodeSDK) ---
    const logProvider = new LoggerProvider({
      resource,
      processors: [new BatchLogRecordProcessor(logExporter)],
    })
    logs.setGlobalLoggerProvider(logProvider)

    // --- NodeSDK handles traces + metrics ---
    const sdk = new NodeSDK({
      traceExporter,
      metricReader,
      instrumentations: [getNodeAutoInstrumentations()],
      resource,
    })

    await sdk.start()
    console.log(`[otel] Telemetry initialized for "${serviceName}"`)

    // --- Graceful shutdown ---
    process.on('SIGTERM', async () => {
      console.log('[otel] Shutting down...')
      await Promise.all([sdk.shutdown(), logProvider.shutdown()])
      console.log('[otel] Shutdown complete.')
      process.exit(0)
    })
  } catch (err) {
    console.error('[otel] Startup error:', err)
  }
}

initialize()
