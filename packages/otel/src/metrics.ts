import { metrics } from '@opentelemetry/api'
import { detectTelemetryContext } from './otel-context'

export function getMeter(componentNameOverride?: string) {
  const { componentName, systemName, systemVersion } = detectTelemetryContext(
    componentNameOverride
  )
  return metrics.getMeter(componentName ?? systemName, systemVersion)
}
