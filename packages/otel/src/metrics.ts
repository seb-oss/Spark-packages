import { metrics } from '@opentelemetry/api'
import { initialize } from './otel'
import { detectTelemetryContext } from './otel-context'

export async function getMeter(componentNameOverride?: string) {
  await initialize()
  const { componentName, systemName, systemVersion } = detectTelemetryContext(
    componentNameOverride
  )
  return metrics.getMeter(componentName ?? systemName, systemVersion)
}
