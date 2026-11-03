import {
  context,
  DiagConsoleLogger,
  DiagLogLevel,
  diag,
  logs,
  metrics,
  trace,
} from '@opentelemetry/api'
import type { Instrumentation } from '@opentelemetry/instrumentation'
import { NodeSDK } from '@opentelemetry/sdk-node'
import {
  getLogRecordProcessors,
  getMetricReader,
  getSpanProcessor,
} from './providers'
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
  // biome-ignore lint/plugin/no-type-assertion: globalThis has no symbol index signature
  return globalThis as Record<symbol, unknown>
}

export async function initialize(
  ...instrumentations: Promise<Instrumentation>[]
): Promise<void> {
  const g = getGlobal()
  const existing = g[OTEL_INIT_PROMISE_KEY]
  if (existing instanceof Promise) return existing

  const resolvedInstrumentations = await Promise.all(instrumentations)
  const promise = _initialize(resolvedInstrumentations).catch((err) => {
    // Allow re-initialization if the first attempt fails
    g[OTEL_INIT_PROMISE_KEY] = undefined
    throw err
  })
  g[OTEL_INIT_PROMISE_KEY] = promise
  return promise
}

export function isInitialized() {
  return getGlobal()[OTEL_INIT_KEY] === true
}

let sdk: NodeSDK | undefined

async function _initialize(instrumentations: Instrumentation[]) {
  const serviceName = process.env.OTEL_SERVICE_NAME ?? 'unknown-service'
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

  const resource = await getResource()

  // Reset any previous instrumentation
  context.disable()
  logs.disable()
  trace.disable()
  metrics.disable()

  // NodeSDK owns all providers. Without logRecordProcessors it would build a
  // second, env-based LoggerProvider and fail to register it globally.
  sdk = new NodeSDK({
    spanProcessors: [getSpanProcessor(otlpEndpoint)],
    metricReaders: [getMetricReader(otlpEndpoint)],
    logRecordProcessors: getLogRecordProcessors(otlpEndpoint),
    instrumentations,
    resource,
  })

  sdk.start()
  getGlobal()[OTEL_INIT_KEY] = true
  console.log(`[otel] Telemetry initialized for "${serviceName}"`)
}

export const dispose = async () => {
  // Only initiate shutdown once
  const current = sdk
  sdk = undefined

  if (current) {
    console.log('[otel] Shutting down...')
    await current.shutdown()
    console.log('[otel] Shutdown complete.')
  }
}
