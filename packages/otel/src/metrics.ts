import { metrics } from '@opentelemetry/api'
import { detectTelemetryContext } from './otel-context'

export function getMeter(serviceOverride?: string) {
  const { serviceName } = detectTelemetryContext(serviceOverride)
  return metrics.getMeter(serviceName)
}
