import {
  detectResources,
  resourceFromAttributes,
} from '@opentelemetry/resources'
import { detectTelemetryContext } from './otel-context'

export const getResource = async () => {
  const baseRes = await detectResources()
  const { resourceAttributes } = detectTelemetryContext()
  const customRes = resourceFromAttributes(resourceAttributes)
  const resource = baseRes.merge(customRes)

  if (resource.waitForAsyncAttributes) {
    await resource.waitForAsyncAttributes()
  }

  return resource
}
