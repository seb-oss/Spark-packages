import { gcpDetector } from '@opentelemetry/resource-detector-gcp'
import * as resources from '@opentelemetry/resources'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('getResource', () => {
  const originalEnv = process.env
  let detectResourcesSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    delete process.env.K_SERVICE
    delete process.env.GAE_APPLICATION
    delete process.env.KUBERNETES_SERVICE_HOST

    detectResourcesSpy = vi
      .spyOn(resources, 'detectResources')
      .mockReturnValue({
        merge: vi.fn().mockReturnValue({}),
        waitForAsyncAttributes: undefined,
      } as any)
  })

  afterEach(() => {
    process.env = originalEnv
    detectResourcesSpy.mockRestore()
  })

  it('does not use gcpDetector when not running on GCP', async () => {
    const { getResource } = await import('./resource')
    await getResource()

    const detectors = detectResourcesSpy.mock.calls[0][0].detectors
    expect(detectors).not.toContain(gcpDetector)
  })

  it('uses gcpDetector on Cloud Run (K_SERVICE)', async () => {
    process.env.K_SERVICE = 'my-service'
    const { getResource } = await import('./resource')
    await getResource()

    const detectors = detectResourcesSpy.mock.calls[0][0].detectors
    expect(detectors).toContain(gcpDetector)
  })

  it('uses gcpDetector on GKE (KUBERNETES_SERVICE_HOST)', async () => {
    process.env.KUBERNETES_SERVICE_HOST = '10.0.0.1'
    const { getResource } = await import('./resource')
    await getResource()

    const detectors = detectResourcesSpy.mock.calls[0][0].detectors
    expect(detectors).toContain(gcpDetector)
  })

  it('uses gcpDetector on App Engine (GAE_APPLICATION)', async () => {
    process.env.GAE_APPLICATION = 'my-app'
    const { getResource } = await import('./resource')
    await getResource()

    const detectors = detectResourcesSpy.mock.calls[0][0].detectors
    expect(detectors).toContain(gcpDetector)
  })
})
