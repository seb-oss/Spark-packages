import {
  context,
  DiagConsoleLogger,
  DiagLogLevel,
  diag,
  metrics,
  trace,
} from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import type { Instrumentation } from '@opentelemetry/instrumentation'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getLogProvider, getMetricReader, getSpanProcessor } from './providers'
import { getResource } from './resource'

diag.disable()
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

let initialization: Promise<void> | undefined
let _isInitialized = false
export async function initialize(...instrumentations: Instrumentation[]) {
  if (!initialization) {
    initialization = _initialize(instrumentations)
    initialization.then(() => { _isInitialized = true })
  }
  return initialization
}

export function isInitialized() {
  return _isInitialized
}

async function _initialize(instrumentations: Instrumentation[]) {
  try {
    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service'
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

    const resource = await getResource()

    // Reset any previous instrumentation
    context.disable()
    logs.disable()
    trace.disable()
    metrics.disable()

    // Manual setup for logs
    const logProvider = getLogProvider(resource, otlpEndpoint)
    logs.setGlobalLoggerProvider(logProvider)

    // NodeSDK setup
    const spanProcessor = getSpanProcessor(otlpEndpoint)
    const metricReader = getMetricReader(otlpEndpoint)
    const sdk = new NodeSDK({
      spanProcessor,
      metricReader,
      instrumentations,
      resource,
    })

    await sdk.start()
    console.log(`[otel] Telemetry initialized for "${serviceName}"`)

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
