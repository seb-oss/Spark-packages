/** Extracts shared telemetry context from environment (cloud/k8s aware) */
export function detectTelemetryContext(serviceOverride?: string) {
  const {
    OTEL_SERVICE_NAME,
    OTEL_SERVICE_VERSION,
    K_SERVICE,
    K_REVISION,
    K_CONFIGURATION,
    KUBERNETES_SERVICE_HOST,
    POD_NAME,
    POD_NAMESPACE,
    GCP_PROJECT,
    CLOUD_PROVIDER,
  } = process.env

  const serviceName = serviceOverride || OTEL_SERVICE_NAME || 'unknown-service'
  const serviceVersion = OTEL_SERVICE_VERSION || '1.0.0'

  const resourceAttributes = {
    'service.name': serviceName,
    'service.version': serviceVersion,
    'serviceContext.service': serviceName,
    'serviceContext.version': serviceVersion,
    ...(K_SERVICE && { 'cloud.run.service': K_SERVICE }),
    ...(K_REVISION && { 'cloud.run.revision': K_REVISION }),
    ...(K_CONFIGURATION && { 'cloud.run.configuration': K_CONFIGURATION }),
    ...(POD_NAME && { 'k8s.pod_name': POD_NAME }),
    ...(POD_NAMESPACE && { 'k8s.namespace_name': POD_NAMESPACE }),
    ...(KUBERNETES_SERVICE_HOST && { 'cloud.orchestrator': 'kubernetes' }),
    ...(GCP_PROJECT && { 'cloud.account.id': GCP_PROJECT }),
    ...(CLOUD_PROVIDER && { 'cloud.provider': CLOUD_PROVIDER }),
  }

  return {
    serviceName,
    serviceVersion,
    resourceAttributes,
  }
}
