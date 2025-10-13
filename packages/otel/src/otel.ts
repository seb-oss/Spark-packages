import {
  context,
  DiagConsoleLogger,
  DiagLogLevel,
  diag,
} from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getLogProvider, getMetricReader, getSpanProcessor } from './providers'
import { getResource } from './resource'

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

let isInitialized = false
export async function initialize() {
  if (isInitialized) {
    return
  }
  isInitialized = true

  try {
    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service'
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

    const resource = await getResource()

    // Enable context propagation (required for logs + spans to carry trace info)
    const contextManager = new AsyncLocalStorageContextManager().enable()
    context.setGlobalContextManager(contextManager)

    // Manual setup for logs
    const logProvider = getLogProvider(resource, otlpEndpoint)
    logs.setGlobalLoggerProvider(logProvider)

    // NodeSDK setup
    const spanProcessor = getSpanProcessor(otlpEndpoint)
    const metricReader = getMetricReader(otlpEndpoint)
    const sdk = new NodeSDK({
      contextManager,
      spanProcessor,
      metricReader,
      instrumentations: [getNodeAutoInstrumentations()],
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
