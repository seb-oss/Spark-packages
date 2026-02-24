export type DependencyStatusValue = 'ok' | 'degraded' | 'error'
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
  hostname: string
  platform: NodeJS.Platform
  release: string
  arch: string
  uptime: number
  loadavg: [number, number, number] // 1, 5, 15 min
  totalmem: number
  freemem: number
  memUsedRatio: number // 0..1
  cpus: {
    count: number
    model?: string
    speedMHz?: number
  }
}

export type Process = {
  pid: number
  node: string
  uptime: number
  memory: NodeJS.MemoryUsage
}

export type Liveness = Status & {
  timestamp: string
  system: System
  process: Process
}

export type Freshness = {
  lastChecked: string
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
  critical: { ok: number; failing: number }
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
