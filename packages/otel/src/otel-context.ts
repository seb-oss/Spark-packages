import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'

/**
 * Extracts telemetry context from environment (cloud/k8s aware),
 * with support for subservice/component override.
 */
export function detectTelemetryContext(componentNameOverride?: string) {
  const {
    OTEL_SERVICE_NAME, // e.g. "UserSystem"
    OTEL_SERVICE_VERSION, // e.g. "1.2.3"
    K_SERVICE,
    K_REVISION,
    K_CONFIGURATION,
    KUBERNETES_SERVICE_HOST,
    POD_NAME,
    POD_NAMESPACE,
    GCP_PROJECT,
    CLOUD_PROVIDER,
  } = process.env

  const systemName = OTEL_SERVICE_NAME || 'unknown-service'
  const systemVersion = OTEL_SERVICE_VERSION || '1.0.0'

  // Only use component if explicitly provided
  const componentName = componentNameOverride || undefined

  const resourceAttributes = {
    [ATTR_SERVICE_NAME]: systemName,
    [ATTR_SERVICE_VERSION]: systemVersion,
    'serviceContext.service': systemName,
    'serviceContext.version': systemVersion,
    ...(K_SERVICE && { 'cloud.run.service': K_SERVICE }),
    ...(K_REVISION && { 'cloud.run.revision': K_REVISION }),
    ...(K_CONFIGURATION && { 'cloud.run.configuration': K_CONFIGURATION }),
    ...(POD_NAME && { 'k8s.pod_name': POD_NAME }),
    ...(POD_NAMESPACE && { 'k8s.namespace_name': POD_NAMESPACE }),
    ...(KUBERNETES_SERVICE_HOST && { 'cloud.orchestrator': 'kubernetes' }),
    ...(GCP_PROJECT && { 'cloud.account.id': GCP_PROJECT }),
    ...(CLOUD_PROVIDER && { 'cloud.provider': CLOUD_PROVIDER }),
    ...(componentName && { 'component.name': componentName }),
  }

  return {
    systemName,
    systemVersion,
    componentName,
    resourceAttributes,
  }
}
