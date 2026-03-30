import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { detectTelemetryContext } from './otel-context'

describe('detectTelemetryContext', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    delete process.env.OTEL_SERVICE_NAME
    delete process.env.OTEL_SERVICE_VERSION
    delete process.env.K_SERVICE
    delete process.env.K_REVISION
    delete process.env.K_CONFIGURATION
    delete process.env.KUBERNETES_SERVICE_HOST
    delete process.env.POD_NAME
    delete process.env.POD_NAMESPACE
    delete process.env.GCP_PROJECT
    delete process.env.CLOUD_PROVIDER
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('uses default values when no env vars are set', () => {
    const ctx = detectTelemetryContext()
    expect(ctx.systemName).toBe('unknown-service')
    expect(ctx.systemVersion).toBe('1.0.0')
    expect(ctx.componentName).toBeUndefined()
    expect(ctx.resourceAttributes[ATTR_SERVICE_NAME]).toBe('unknown-service')
    expect(ctx.resourceAttributes[ATTR_SERVICE_VERSION]).toBe('1.0.0')
  })

  it('uses OTEL_SERVICE_NAME and OTEL_SERVICE_VERSION when set', () => {
    process.env.OTEL_SERVICE_NAME = 'my-service'
    process.env.OTEL_SERVICE_VERSION = '2.3.4'
    const ctx = detectTelemetryContext()
    expect(ctx.systemName).toBe('my-service')
    expect(ctx.systemVersion).toBe('2.3.4')
    expect(ctx.resourceAttributes[ATTR_SERVICE_NAME]).toBe('my-service')
    expect(ctx.resourceAttributes[ATTR_SERVICE_VERSION]).toBe('2.3.4')
  })

  it('includes cloud.run.* attributes when K_SERVICE, K_REVISION, K_CONFIGURATION are set', () => {
    process.env.K_SERVICE = 'my-cloud-run-service'
    process.env.K_REVISION = 'my-cloud-run-service-00001'
    process.env.K_CONFIGURATION = 'my-cloud-run-service'
    const ctx = detectTelemetryContext()
    expect(ctx.resourceAttributes['cloud.run.service']).toBe(
      'my-cloud-run-service'
    )
    expect(ctx.resourceAttributes['cloud.run.revision']).toBe(
      'my-cloud-run-service-00001'
    )
    expect(ctx.resourceAttributes['cloud.run.configuration']).toBe(
      'my-cloud-run-service'
    )
  })

  it('includes cloud.orchestrator=kubernetes when KUBERNETES_SERVICE_HOST is set', () => {
    process.env.KUBERNETES_SERVICE_HOST = '10.0.0.1'
    const ctx = detectTelemetryContext()
    expect(ctx.resourceAttributes['cloud.orchestrator']).toBe('kubernetes')
  })

  it('includes k8s.pod_name and k8s.namespace_name when POD_NAME and POD_NAMESPACE are set', () => {
    process.env.POD_NAME = 'my-pod-abc123'
    process.env.POD_NAMESPACE = 'production'
    const ctx = detectTelemetryContext()
    expect(ctx.resourceAttributes['k8s.pod_name']).toBe('my-pod-abc123')
    expect(ctx.resourceAttributes['k8s.namespace_name']).toBe('production')
  })

  it('includes cloud.account.id when GCP_PROJECT is set', () => {
    process.env.GCP_PROJECT = 'my-gcp-project'
    const ctx = detectTelemetryContext()
    expect(ctx.resourceAttributes['cloud.account.id']).toBe('my-gcp-project')
  })

  it('includes cloud.provider when CLOUD_PROVIDER is set', () => {
    process.env.CLOUD_PROVIDER = 'gcp'
    const ctx = detectTelemetryContext()
    expect(ctx.resourceAttributes['cloud.provider']).toBe('gcp')
  })

  it('uses componentNameOverride when provided', () => {
    const ctx = detectTelemetryContext('my-component')
    expect(ctx.componentName).toBe('my-component')
    expect(ctx.resourceAttributes['component.name']).toBe('my-component')
  })

  it('does not include component.name when no componentNameOverride is given', () => {
    const ctx = detectTelemetryContext()
    expect(ctx.resourceAttributes['component.name']).toBeUndefined()
  })

  it('does not include cloud.run.* attributes when K vars are not set', () => {
    const ctx = detectTelemetryContext()
    expect(ctx.resourceAttributes['cloud.run.service']).toBeUndefined()
    expect(ctx.resourceAttributes['cloud.run.revision']).toBeUndefined()
    expect(ctx.resourceAttributes['cloud.run.configuration']).toBeUndefined()
  })
})
