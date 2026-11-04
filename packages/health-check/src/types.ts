export type DependencyStatusValue = 'ok' | 'degraded' | 'error'
export type DependencyStatus = {
  status: DependencyStatusValue
  details?: Record<string, unknown> | undefined
}
export type StatusValue = DependencyStatusValue | 'unknown' | 'draining'
export type Impact = 'critical' | 'non_critical'
export type Mode = 'inline' | 'polled' | 'async'

export type Verb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type Link = {
  method: Verb
  href: string
}

export interface Entity<T> {
  data: T
  links: Record<string, Link>
}

export type Status = {
  status: StatusValue
}

export type System = {
  /**
   * Whether memory/CPU figures come from the container's cgroup limits or
   * the host node (`os.*`). `'host'` only when no cgroup limits are found.
   */
  resourceSource: 'cgroup' | 'host'
  /**
   * Host node uptime in seconds. Only present when `resourceSource` is
   * `'host'`; has no meaningful cgroup equivalent. See `process.uptime` for
   * the process's own uptime.
   */
  uptime?: number
  /**
   * Host node load averages for 1, 5, 15 minutes, across all containers on
   * the node. Only present when `resourceSource` is `'host'`.
   */
  loadavg?: [number, number, number]
  /** Container memory limit in bytes when `resourceSource` is `'cgroup'`; host total memory otherwise. */
  totalmem: number
  /** Container memory headroom (limit - usage) in bytes when `resourceSource` is `'cgroup'`; host free memory otherwise. */
  freemem: number
  memUsedRatio: number // 0..1
  cpus: {
    /**
     * Container's allotted vCPU share (can be fractional, e.g. `0.5`) when
     * `resourceSource` is `'cgroup'`; host physical core count otherwise.
     */
    count: number
  }
}

export type Process = {
  uptime: number
  memory: NodeJS.MemoryUsage
}

export type Liveness = Status & {
  timestamp: string
  system: System
  process: Process
}

export type Freshness = {
  /** `null` until the first check has completed. */
  lastChecked: string | null
  /** `null` until a check has succeeded. */
  lastSuccess: string | null
}

export type Observed = {
  latencyMs: number | null
  [k: string]: unknown
}

export type CheckError = {
  code: string
  message: string
}

export type DependencyCheck = Status & {
  impact: Impact
  mode: Mode
  freshness: Freshness
  observed?: Observed
  details?: Record<string, unknown>
  error?: CheckError | null
  since?: string | null
}

export type ReadinessSummary = {
  critical: { ok: number; degraded: number; failing: number }
  nonCritical: { ok: number; degraded: number; failing: number }
  degradedReasons: string[]
}

export type ReadinessPayload = Status & {
  timestamp: string
  service?: { name?: string; version?: string; instanceId?: string }
  summary: ReadinessSummary
  checks: Record<string, DependencyCheck>
}

export type HealthSummary = Status &
  Pick<ReadinessPayload, 'summary' | 'checks'> &
  Pick<Liveness, 'system' | 'process'> & { timestamp: string }

export class TimeoutError extends Error {
  constructor() {
    super('timeout')
    this.name = 'TimeoutError'
  }
}

export class UnknownError extends Error {
  constructor() {
    super('unknown')
    this.name = 'UnknownError'
  }
}
