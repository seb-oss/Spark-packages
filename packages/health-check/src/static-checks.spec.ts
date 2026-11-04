import { afterEach, describe, expect, it, vi } from 'vitest'
import { readCgroupCpu, readCgroupMemory } from './cgroup'
import { liveness, ping } from './static-checks'

vi.mock('./cgroup', () => ({
  readCgroupMemory: vi.fn(),
  readCgroupCpu: vi.fn(),
}))

const mockedReadCgroupMemory = vi.mocked(readCgroupMemory)
const mockedReadCgroupCpu = vi.mocked(readCgroupCpu)

describe('ping', () => {
  it('returns ok', () => {
    expect(ping()).toEqual({ status: 'ok' })
  })
})

describe('liveness', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('reports host-scoped system metrics when no cgroup limits are found', () => {
    mockedReadCgroupMemory.mockReturnValue(null)
    mockedReadCgroupCpu.mockReturnValue(null)

    const result = liveness()

    expect(result.system).toMatchObject({
      resourceSource: 'host',
      uptime: expect.any(Number),
      totalmem: expect.any(Number),
      freemem: expect.any(Number),
      memUsedRatio: expect.any(Number),
      cpus: { count: expect.any(Number) },
    })
    expect(result.system.loadavg).toHaveLength(3)
  })

  it('reports container-scoped memory and CPU when cgroup limits are found', () => {
    mockedReadCgroupMemory.mockReturnValue({
      limit: 536870912,
      usage: 134217728,
    })
    mockedReadCgroupCpu.mockReturnValue({ quota: 0.5 })

    const result = liveness()

    expect(result.system).toEqual({
      resourceSource: 'cgroup',
      totalmem: 536870912,
      freemem: 402653184,
      memUsedRatio: 0.25,
      cpus: { count: 0.5 },
    })
    expect(result.system.uptime).toBeUndefined()
    expect(result.system.loadavg).toBeUndefined()
  })

  it('falls back to the host CPU count when only a cgroup memory limit is found', () => {
    mockedReadCgroupMemory.mockReturnValue({
      limit: 536870912,
      usage: 134217728,
    })
    mockedReadCgroupCpu.mockReturnValue(null)

    const result = liveness()

    expect(result.system.resourceSource).toBe('cgroup')
    expect(result.system.totalmem).toBe(536870912)
    expect(result.system.cpus.count).toEqual(expect.any(Number))
  })

  it('falls back to the host memory when only a cgroup CPU quota is found', () => {
    mockedReadCgroupMemory.mockReturnValue(null)
    mockedReadCgroupCpu.mockReturnValue({ quota: 0.5 })

    const result = liveness()

    expect(result.system.resourceSource).toBe('cgroup')
    expect(result.system.cpus).toEqual({ count: 0.5 })
    expect(result.system.totalmem).toEqual(expect.any(Number))
  })

  it('returns a zero memUsedRatio when the cgroup memory limit is zero', () => {
    mockedReadCgroupMemory.mockReturnValue({ limit: 0, usage: 0 })
    mockedReadCgroupCpu.mockReturnValue(null)

    const result = liveness()

    expect(result.system.memUsedRatio).toBe(0)
  })

  it('returns ok and a fresh timestamp alongside process metrics', () => {
    mockedReadCgroupMemory.mockReturnValue(null)
    mockedReadCgroupCpu.mockReturnValue(null)

    const before = Date.now()
    const result = liveness()

    expect(result.status).toBe('ok')
    expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(before)
    expect(result.process).toMatchObject({
      uptime: expect.any(Number),
      memory: expect.any(Object),
    })
  })
})
