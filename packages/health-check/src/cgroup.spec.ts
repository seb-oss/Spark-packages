import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readCgroupCpu, readCgroupMemory } from './cgroup'

vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))

const mockedReadFileSync = vi.mocked(readFileSync)

const whenReading = (files: Record<string, string>) => {
  mockedReadFileSync.mockImplementation((path) => {
    const content = files[path as string]
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`)
    }
    return content
  })
}

describe('readCgroupMemory', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('reads limit and usage from cgroup v2', () => {
    whenReading({
      '/sys/fs/cgroup/memory.max': '536870912\n',
      '/sys/fs/cgroup/memory.current': '134217728\n',
    })

    expect(readCgroupMemory()).toEqual({ limit: 536870912, usage: 134217728 })
  })

  it('treats cgroup v2 "max" as unlimited', () => {
    whenReading({
      '/sys/fs/cgroup/memory.max': 'max\n',
      '/sys/fs/cgroup/memory.current': '134217728\n',
    })

    expect(readCgroupMemory()).toEqual({ limit: null, usage: 134217728 })
  })

  it('falls back to cgroup v1 when v2 files are absent', () => {
    whenReading({
      '/sys/fs/cgroup/memory/memory.limit_in_bytes': '536870912\n',
      '/sys/fs/cgroup/memory/memory.usage_in_bytes': '134217728\n',
    })

    expect(readCgroupMemory()).toEqual({ limit: 536870912, usage: 134217728 })
  })

  it('treats the cgroup v1 sentinel value as unlimited', () => {
    whenReading({
      '/sys/fs/cgroup/memory/memory.limit_in_bytes': '9223372036854771712\n',
      '/sys/fs/cgroup/memory/memory.usage_in_bytes': '134217728\n',
    })

    expect(readCgroupMemory()).toEqual({ limit: null, usage: 134217728 })
  })

  it('returns null when no cgroup memory files are present', () => {
    whenReading({})

    expect(readCgroupMemory()).toBeNull()
  })
})

describe('readCgroupCpu', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('computes the vCPU share from cgroup v2 cpu.max', () => {
    whenReading({ '/sys/fs/cgroup/cpu.max': '50000 100000\n' })

    expect(readCgroupCpu()).toEqual({ quota: 0.5 })
  })

  it('treats cgroup v2 "max" as unlimited', () => {
    whenReading({ '/sys/fs/cgroup/cpu.max': 'max 100000\n' })

    expect(readCgroupCpu()).toEqual({ quota: null })
  })

  it('falls back to cgroup v1 cfs_quota_us / cfs_period_us', () => {
    whenReading({
      '/sys/fs/cgroup/cpu/cpu.cfs_quota_us': '50000\n',
      '/sys/fs/cgroup/cpu/cpu.cfs_period_us': '100000\n',
    })

    expect(readCgroupCpu()).toEqual({ quota: 0.5 })
  })

  it('treats a cgroup v1 quota of -1 as unlimited', () => {
    whenReading({
      '/sys/fs/cgroup/cpu/cpu.cfs_quota_us': '-1\n',
      '/sys/fs/cgroup/cpu/cpu.cfs_period_us': '100000\n',
    })

    expect(readCgroupCpu()).toEqual({ quota: null })
  })

  it('returns null when cgroup v2 reports a non-positive period', () => {
    whenReading({ '/sys/fs/cgroup/cpu.max': '50000 0\n' })

    expect(readCgroupCpu()).toBeNull()
  })

  it('returns null when cgroup v1 reports a non-positive period', () => {
    whenReading({
      '/sys/fs/cgroup/cpu/cpu.cfs_quota_us': '50000\n',
      '/sys/fs/cgroup/cpu/cpu.cfs_period_us': '0\n',
    })

    expect(readCgroupCpu()).toBeNull()
  })

  it('returns null when no cgroup cpu files are present', () => {
    whenReading({})

    expect(readCgroupCpu()).toBeNull()
  })
})
