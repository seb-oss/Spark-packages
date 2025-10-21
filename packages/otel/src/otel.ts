import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getLogProvider, getMetricReader, getSpanProcessor } from './providers'
import { getResource } from './resource'

let initialization: Promise<void> | undefined
export async function initialize() {
  if (!initialization) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)
    initialization = initializeOtel()
  }
  return initialization
}

// For testing - allow resetting initialization state

export function isInitialized() {
  return initialization !== undefined
}

async function initializeOtel() {
  try {
    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service'
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    const isTestMode =
      process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

    const resource = await getResource()

    // Manual setup for logs - skip in test mode unless console logging is explicitly requested
    let logProvider: ReturnType<typeof getLogProvider> | undefined
    const shouldSetupLogProvider = !isTestMode || !!process.env.LOG_LEVEL
    if (shouldSetupLogProvider) {
      logProvider = getLogProvider(resource, otlpEndpoint)
      logs.setGlobalLoggerProvider(logProvider)
    }

    // NodeSDK setup
    const spanProcessor = getSpanProcessor(otlpEndpoint)
    const metricReader = getMetricReader(otlpEndpoint)
    const sdk = new NodeSDK({
      spanProcessor,
      metricReader,
      instrumentations: [getNodeAutoInstrumentations()],
      resource,
    })

    await sdk.start()
    console.log(`[otel] Telemetry initialized for "${serviceName}"`)

    process.on('SIGTERM', async () => {
      console.log('[otel] Shutting down...')
      const shutdownPromises = [sdk.shutdown()]
      if (logProvider) {
        shutdownPromises.push(logProvider.shutdown())
      }
      await Promise.all(shutdownPromises)
      console.log('[otel] Shutdown complete.')
      process.exit(0)
    })
  } catch (err) {
    // In test environments, duplicate registration errors are common
    // and can be safely ignored as long as telemetry is functional
    if (
      err instanceof Error &&
      err.message.includes('duplicate registration')
    ) {
      console.warn('[otel] Warning - API already registered, continuing...')
    } else {
      console.error('[otel] Startup error:', err)
    }
  }
}
