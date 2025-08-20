import { Router } from 'express'
import {
  DependencyMonitor,
  type DependencyMonitorConfig,
} from './dependency-monitor'
import { liveness, ping } from './static-checks'
import { throttle } from './timing'
import type { DependencyCheck, Impact } from './types'

export interface HealthMonitorConfig {
  throttle: number
}

/**
 * HealthMonitor wires up standard health check endpoints for an Express app.
 *
 * It provides three endpoints under `/health`:
 * - /ping → lightweight always-OK response (`{ status: "ok" }`)
 * - /live → liveness probe (`{ status, uptime, timestamp }`)
 * - /ready → readiness probe with dependency checks (`{ status, checks }`)
 *
 * Dependencies can be added via {@link addDependency} with a {@link DependencyMonitorConfig}.
 * Each dependency is wrapped in a {@link DependencyMonitor} and tracked for readiness.
 *
 * ### Example
 *
 * ```ts
 * import express from 'express'
 * import { HealthMonitor } from './health-monitor'
 *
 * const app = express()
 * const monitor = new HealthMonitor()
 *
 * monitor.addDependency('db', {
 *   impact: 'critical',
 *   syncCall: async () => {
 *     await db.ping()
 *     return 'ok'
 *   }
 * })
 *
 * app.use(monitor.router)
 * app.listen(3000)
 * ```
 */
export class HealthMonitor {
  private readonly _router: Router
  private readonly dependencies: Map<string, DependencyMonitor>
  private isDisposed = false

  /**
   * Create a new HealthMonitor instance with its own router and dependency map.
   */
  constructor(config?: HealthMonitorConfig) {
    this._router = this.createRouter()
    this.dependencies = new Map()

    const thr = config ? config.throttle : 10
    if (thr > 0) {
      this.ready = throttle(this.ready.bind(this), thr)
    }
  }

  /**
   * Register a named dependency to be checked as part of readiness.
   *
   * @param name - Identifier for the dependency (e.g. "postgres", "redis").
   * @param dependency - DependencyMonitor
   * @returns this for chaining
   *
   * @example
   * ```ts
   * monitor.addDependency('redis', new DependencyMonitor({
   *   impact: 'critical',
   *   pollRate: 5000,
   *   syncCall: async () => redis.ping() ? 'ok' : 'error'
   * }))
   * ```
   */
  public addDependency(name: string, dependency: DependencyMonitor) {
    this.dependencies.set(name, dependency)
    return this
  }

  /**
   * Internal: create the Express router with /health routes.
   */
  private createRouter() {
    const router = Router()

    // Ping
    router.get('/health/ping', (_req, res) => {
      res.status(200).json(this.ping())
    })

    // Liveness
    router.get('/health/live', (_req, res) => {
      res.status(200).json(this.live())
    })

    // Readiness
    router.get('/health/ready', async (_req, res) => {
      const readiness = await this.ready()
      res.status(200).json(readiness)
    })

    return router
  }

  /**
   * Static ping check — always returns `{ status: "ok" }`.
   */
  public ping() {
    return ping()
  }

  /**
   * Liveness probe: reports uptime and current timestamp.
   */
  public live() {
    return liveness()
  }

  /**
   * Readiness probe: runs all registered dependencies in parallel
   * and aggregates their results into an overall status.
   *
   * - Any **critical error** → `"error"`
   * - Else any **critical degraded** or any non-critical degraded/error → `"degraded"`
   * - Else → `"ok"`
   *
   * @returns Object with overall `status` and per-dependency `checks`
   *
   * @example
   * ```json
   * {
   *   "status": "ok",
   *   "checks": {
   *     "postgres": {
   *       "status": "ok",
   *       "impact": "critical",
   *       "mode": "inline",
   *       "freshness": {
   *         "lastChecked": "2025-08-19T12:00:00Z",
   *         "lastSuccess": "2025-08-19T12:00:00Z"
   *       },
   *       "observed": { "latencyMs": 12 }
   *     }
   *   }
   * }
   * ```
   */
  public async ready() {
    const entries = Array.from(this.dependencies.entries())

    const settled = await Promise.allSettled(
      entries.map(async ([name, monitor]) => {
        const check = await monitor.check()
        return [name, check] as const
      })
    )

    const checks: Record<string, DependencyCheck> = {}

    for (let i = 0; i < settled.length; i++) {
      const s = settled[i]
      const [name] = entries[i]

      if (s.status === 'fulfilled') {
        const [, check] = s.value
        checks[name] = check
      } else {
        checks[name] = {
          status: 'error',
          impact: this.dependencies.get(name)?.impact as Impact,
          mode: 'polled',
          freshness: {
            lastChecked: new Date().toISOString(),
            lastSuccess: null,
          },
          observed: undefined,
          error: {
            code: 'CHECK_FAILED',
            message: String(s.reason ?? 'unknown error'),
          },
        }
      }
    }

    let status: import('./types').StatusValue = 'ok'

    const values = Object.values(checks)
    const anyCriticalError = values.some(
      (c) => c.impact === 'critical' && c.status === 'error'
    )
    const anyDegradedOrError = values.some(
      (c) => c.status === 'degraded' || c.status === 'error'
    )
    const anyCriticalDegraded = values.some(
      (c) => c.impact === 'critical' && c.status === 'degraded'
    )

    if (anyCriticalError) status = 'error'
    else if (anyCriticalDegraded || anyDegradedOrError) status = 'degraded'

    return { status, checks }
  }

  /**
   * Accessor for the Express router that exposes /health endpoints.
   */
  public get router() {
    return this._router
  }

  /**
   * Symbol-based disposer for use with `using`.
   */
  public [Symbol.dispose]() {
    this.dispose()
  }

  /**
   * Dispose of the monitor:
   * - marks as disposed
   * - (future: could also stop all dependency monitors)
   */
  public dispose() {
    this.isDisposed = true
    for (const dependency of this.dependencies.values()) {
      dependency.dispose()
    }
  }
}
