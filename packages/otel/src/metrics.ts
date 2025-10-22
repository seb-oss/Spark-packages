import { metrics } from '@opentelemetry/api'
import { isInitialized } from './otel'
import { detectTelemetryContext } from './otel-context'

export function getMeter(componentNameOverride?: string) {
  if (!isInitialized()) {
    throw new Error('OTEL must be initialized before calling getMeter()')
  }

  const { componentName, systemName, systemVersion } = detectTelemetryContext(
    componentNameOverride
  )
  return metrics.getMeter(componentName ?? systemName, systemVersion)
}
