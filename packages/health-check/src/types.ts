export type StatusValue = 'ok' | 'degraded' | 'error'
export type Impact = 'critical' | 'non_critical'
export type Mode = 'inline' | 'polled' | 'async'

export type Status = {
  status: StatusValue
}

export type Liveness = Status & {
  uptime: number
  timestamp: string
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
