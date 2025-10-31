import { containerDetector } from '@opentelemetry/resource-detector-container'
import { gcpDetector } from '@opentelemetry/resource-detector-gcp'
import {
  detectResources,
  envDetector,
  osDetector,
  processDetector,
  resourceFromAttributes,
  serviceInstanceIdDetector,
} from '@opentelemetry/resources'
import { detectTelemetryContext } from './otel-context.js'

export const getResource = async () => {
  const baseRes = await detectResources({
    detectors: [
      containerDetector,
      envDetector,
      gcpDetector,
      osDetector,
      processDetector,
      serviceInstanceIdDetector,
    ],
  })

  if (baseRes.waitForAsyncAttributes) {
    await baseRes.waitForAsyncAttributes()
  }

  const { resourceAttributes } = detectTelemetryContext()
  const customRes = resourceFromAttributes(resourceAttributes)
  const resource = baseRes.merge(customRes)

  if (resource.waitForAsyncAttributes) {
    await resource.waitForAsyncAttributes()
  }

  return resource
}
