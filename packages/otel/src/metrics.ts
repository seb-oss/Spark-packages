import { metrics } from '@opentelemetry/api'
import { isInitialized } from './otel.js'
import { detectTelemetryContext } from './otel-context.js'

export function getMeter(componentNameOverride?: string) {
  if (!isInitialized() && process.env.NODE_ENV !== 'test') {
    console.warn('OTEL must be initialized before using getMeter()')
  }

  const { componentName, systemName, systemVersion } = detectTelemetryContext(
    componentNameOverride
  )
  return metrics.getMeter(componentName ?? systemName, systemVersion)
}
