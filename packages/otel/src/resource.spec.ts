import { gcpDetector } from '@opentelemetry/resource-detector-gcp'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getResource } from './resource'

const { detectResources } = vi.hoisted(() => ({
  detectResources: vi.fn(),
}))

vi.mock('@opentelemetry/resources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@opentelemetry/resources')>()),
  detectResources,
}))

describe('getResource', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.K_SERVICE
    delete process.env.GAE_APPLICATION
    delete process.env.KUBERNETES_SERVICE_HOST

    detectResources.mockReturnValue({
      merge: vi.fn().mockReturnValue({}),
      waitForAsyncAttributes: undefined,
    })
  })

  afterEach(() => {
    process.env = originalEnv
    detectResources.mockReset()
  })

  it('does not use gcpDetector when not running on GCP', async () => {
    await getResource()

    const detectors = detectResources.mock.calls[0][0].detectors
    expect(detectors).not.toContain(gcpDetector)
  })

  it('uses gcpDetector on Cloud Run (K_SERVICE)', async () => {
    process.env.K_SERVICE = 'my-service'
    await getResource()

    const detectors = detectResources.mock.calls[0][0].detectors
    expect(detectors).toContain(gcpDetector)
  })

  it('uses gcpDetector on GKE (KUBERNETES_SERVICE_HOST)', async () => {
    process.env.KUBERNETES_SERVICE_HOST = '10.0.0.1'
    await getResource()

    const detectors = detectResources.mock.calls[0][0].detectors
    expect(detectors).toContain(gcpDetector)
  })

  it('uses gcpDetector on App Engine (GAE_APPLICATION)', async () => {
    process.env.GAE_APPLICATION = 'my-app'
    await getResource()

    const detectors = detectResources.mock.calls[0][0].detectors
    expect(detectors).toContain(gcpDetector)
  })
})
