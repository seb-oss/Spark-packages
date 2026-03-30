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
import type { LoggerProvider } from '@opentelemetry/sdk-logs'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getLogProvider, getMetricReader, getSpanProcessor } from './providers'
import { getResource } from './resource'

diag.disable()
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

// Use globalThis with a Symbol key so the flag is shared even when the module
// is instantiated more than once (e.g. --import preload vs main app graph when
// using tsx or other loaders that don't share the ESM module cache).
const OTEL_INIT_KEY = Symbol.for('@sebspark/otel:initialized')
const OTEL_INIT_PROMISE_KEY = Symbol.for('@sebspark/otel:initPromise')

function getGlobal(): {
  [key: symbol]: unknown
} {
  return globalThis as Record<symbol, unknown>
}

export async function initialize(
  ...instrumentations: Promise<Instrumentation>[]
) {
  const g = getGlobal()
  if (!g[OTEL_INIT_PROMISE_KEY]) {
    const resolvedInstrumentations = await Promise.all(instrumentations)
    const promise = _initialize(resolvedInstrumentations).catch((err) => {
      // Allow re-initialization if the first attempt fails
      g[OTEL_INIT_PROMISE_KEY] = undefined
      throw err
    })
    g[OTEL_INIT_PROMISE_KEY] = promise
  }
  return g[OTEL_INIT_PROMISE_KEY] as Promise<void>
}

export function isInitialized() {
  return getGlobal()[OTEL_INIT_KEY] === true
}

let sdk: NodeSDK | undefined
let logProvider: LoggerProvider | undefined

async function _initialize(instrumentations: Instrumentation[]) {
  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service'
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

  const resource = await getResource()

  // Reset any previous instrumentation
  context.disable()
  logs.disable()
  trace.disable()
  metrics.disable()

  // Manual setup for logs
  logProvider = getLogProvider(resource, otlpEndpoint)
  logs.setGlobalLoggerProvider(logProvider)

  // NodeSDK setup
  const spanProcessor = getSpanProcessor(otlpEndpoint)
  const metricReader = getMetricReader(otlpEndpoint)
  sdk = new NodeSDK({
    spanProcessor,
    metricReader,
    instrumentations,
    resource,
  })

  sdk.start()
  getGlobal()[OTEL_INIT_KEY] = true
  console.log(`[otel] Telemetry initialized for "${serviceName}"`)
}

export const dispose = async () => {
  const processes: Promise<void>[] = []
  if (sdk) processes.push(sdk.shutdown())
  if (logProvider) processes.push(logProvider.shutdown())

  if (processes.length) {
    console.log('[otel] Shutting down...')
    await Promise.all(processes)
    console.log('[otel] Shutdown complete.')
  }
}
