import { readFileSync } from 'node:fs'

/** Memory limit/usage as reported by the container's cgroup. */
export type CgroupMemory = {
  /** Bytes, or `null` when the cgroup has no memory limit (unbounded). */
  limit: number | null
  /** Bytes currently in use. */
  usage: number
}

/** CPU allotment as reported by the container's cgroup. */
export type CgroupCpu = {
  /** Allotted vCPU share (can be fractional, e.g. `0.5`), or `null` when unbounded. */
  quota: number | null
}

/** cgroup v1's sentinel for "no memory limit set" (close to 2^63, in practice 9223372036854771712). */
const CGROUP_V1_UNLIMITED_MEMORY = 1e18

const readFile = (path: string): string | null => {
  try {
    return readFileSync(path, 'utf8').trim()
  } catch {
    return null
  }
}

/**
 * Reads the container's memory limit and current usage from the cgroup
 * filesystem, preferring cgroup v2 and falling back to cgroup v1.
 * Returns `null` when neither is available (e.g. not running in a container).
 */
export const readCgroupMemory = (): CgroupMemory | null => {
  const maxV2 = readFile('/sys/fs/cgroup/memory.max')
  const currentV2 = readFile('/sys/fs/cgroup/memory.current')
  if (maxV2 !== null && currentV2 !== null) {
    return {
      limit: maxV2 === 'max' ? null : Number(maxV2),
      usage: Number(currentV2),
    }
  }

  const limitV1 = readFile('/sys/fs/cgroup/memory/memory.limit_in_bytes')
  const usageV1 = readFile('/sys/fs/cgroup/memory/memory.usage_in_bytes')
  if (limitV1 !== null && usageV1 !== null) {
    const limit = Number(limitV1)
    return {
      limit: limit >= CGROUP_V1_UNLIMITED_MEMORY ? null : limit,
      usage: Number(usageV1),
    }
  }

  return null
}

/**
 * Reads the container's allotted vCPU share from the cgroup filesystem,
 * preferring cgroup v2 and falling back to cgroup v1. Returns `null` when
 * neither is available (e.g. not running in a container).
 */
export const readCgroupCpu = (): CgroupCpu | null => {
  const maxV2 = readFile('/sys/fs/cgroup/cpu.max')
  if (maxV2 !== null) {
    const [quotaRaw, periodRaw] = maxV2.split(' ')
    if (quotaRaw === 'max') return { quota: null }
    const quota = Number(quotaRaw)
    const period = Number(periodRaw)
    return period > 0 ? { quota: quota / period } : null
  }

  const quotaV1 = readFile('/sys/fs/cgroup/cpu/cpu.cfs_quota_us')
  const periodV1 = readFile('/sys/fs/cgroup/cpu/cpu.cfs_period_us')
  if (quotaV1 !== null && periodV1 !== null) {
    const quota = Number(quotaV1)
    const period = Number(periodV1)
    if (quota <= 0) return { quota: null }
    return period > 0 ? { quota: quota / period } : null
  }

  return null
}
