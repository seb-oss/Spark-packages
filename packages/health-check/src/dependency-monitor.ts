import type {
  DependencyCheck,
  Freshness,
  Impact,
  Mode,
  Observed,
  StatusValue,
} from './types'
import { runAgainstTimeout, singleFlight } from './timing'

/**
 * Base configuration shared by all dependency monitor modes.
 */
type BaseConfig = {
  /**
   * Importance of the dependency:
   * - `'critical'` → service cannot run without it
   * - `'non_critical'` → service is degraded but still functional if it fails
   */
  impact: Impact

  /**
   * Polling interval in milliseconds.
   * - Required for polled and async modes
   * - Must not be set for inline mode
   */
  pollRate?: number

  /**
   * Polling interval in milliseconds for failed calls.
   * - Defaults to pollRate for polled and async modes
   * - Must not be set for inline mode
   */
  retryRate?: number
}

/**
 * Inline mode configuration:
 * - `syncCall` is executed **only when `check()` is called**
 * - No polling is performed
 *
 * @example
 * ```ts
 * monitor.addDependency('db', {
 *   impact: 'critical',
 *   syncCall: async () => {
 *     await db.ping()
 *     return 'ok'
 *   }
 * })
 * ```
 */
export type SyncInlineConfig = BaseConfig & {
  /** Function that performs the check immediately when `check()` is called. */
  syncCall: () => Promise<StatusValue>
  asyncCall?: never
  pollRate?: undefined
  retryRate?: undefined


  /**
   * Time in ms before call is considered failed
   * Defaults to 1000
   */
  timeout?: number
}

/**
 * Polled mode configuration:
 * - `syncCall` is executed automatically on an interval defined by `pollRate`
 * - Result is cached; `check()` returns the latest cached result
 *
 * @example
 * ```ts
 * monitor.addDependency('redis', {
 *   impact: 'critical',
 *   pollRate: 10_000,
 *   syncCall: async () => {
 *     await redis.ping()
 *     return 'ok'
 *   }
 * })
 * ```
 */
export type SyncPolledConfig = BaseConfig & {
  /** Function that performs the check at every poll interval. */
  syncCall: () => Promise<StatusValue>
  /** Polling interval in milliseconds. */
  pollRate: number
  asyncCall?: never
}

/**
 * Async mode configuration:
 * - `asyncCall` is executed automatically on an interval defined by `pollRate`
 * - The dependency must call `reportResponse` once the result is available
 * - Useful for async APIs where the result arrives later (e.g. message queue, external HTTP call)
 *
 * @example
 * ```ts
 * monitor.addDependency('paymentsApi', {
 *   impact: 'non_critical',
 *   pollRate: 15_000,
 *   asyncCall: async (report) => {
 *     const res = await fetch('https://api.example.com/health')
 *     report(res.ok ? 'ok' : 'error')
 *   }
 * })
 * ```
 */
export type AsyncConfig = BaseConfig & {
  /**
   * Function that starts an async check.
   * It must call `reportResponse` with the resulting status when available.
   */
  asyncCall: (
    reportResponse: (status: StatusValue) => void | Promise<void>
  ) => void | Promise<void>
  /** Polling interval in milliseconds. */
  pollRate: number
  syncCall?: never
}

/**
 * Configuration for a dependency monitor.
 *
 * One of:
 * - {@link SyncInlineConfig} → inline checks on demand
 * - {@link SyncPolledConfig} → synchronous checks on a fixed interval
 * - {@link AsyncConfig} → asynchronous checks that report back via callback
 */
export type DependencyMonitorConfig =
  | SyncInlineConfig
  | SyncPolledConfig
  | AsyncConfig

/**
 * DependencyMonitor is responsible for tracking the health of a dependency
 * using one of three modes:
 *
 * - **inline**: `syncCall` executed only when `check()` is called
 * - **polled**: `syncCall` executed periodically on `pollRate`
 * - **async**: `asyncCall` executed periodically on `pollRate` and reports via callback
 *
 * It records the last status, freshness, and observed latency.
 *
 * ### Examples
 *
 * #### Inline
 * ```ts
 * const monitor = new DependencyMonitor({
 *   impact: 'critical',
 *   syncCall: async () => {
 *     await db.ping()
 *     return 'ok'
 *   }
 * })
 *
 * const status = await monitor.check()
 * console.log(status.status) // "ok" or "error"
 * ```
 *
 * #### Polled
 * ```ts
 * const monitor = new DependencyMonitor({
 *   impact: 'critical',
 *   pollRate: 10_000,
 *   syncCall: async () => {
 *     await redis.ping()
 *     return 'ok'
 *   }
 * })
 *
 * // Automatically runs every 10 seconds, cached result returned by check()
 * const snapshot = await monitor.check()
 * ```
 *
 * #### Async
 * ```ts
 * const monitor = new DependencyMonitor({
 *   impact: 'non_critical',
 *   pollRate: 15_000,
 *   asyncCall: async (report) => {
 *     // fire async request
 *     const res = await fetch('https://api.example.com/health')
 *     report(res.ok ? 'ok' : 'error')
 *   }
 * })
 *
 * // Cached async result
 * const snapshot = await monitor.check()
 * ```
 */
export class DependencyMonitor {
  private readonly config: DependencyMonitorConfig
  private readonly mode: Mode

  private status?: StatusValue
  private observed?: Observed
  private freshness?: Freshness

  private isDisposed = false
  private timeout?: NodeJS.Timeout

  /**
   * Creates a new DependencyMonitor for the given config.
   * @param config Monitor configuration (inline, polled, or async).
   */
  constructor(config: DependencyMonitorConfig) {
    this.config = config

    this.mode = config.asyncCall
      ? 'async'
      : config.pollRate
        ? 'polled'
        : 'inline'

    // only one call for check at a time
    if (this.mode === 'inline') {
      this.check = singleFlight(this.check.bind(this))
    }

    if (this.mode !== 'inline') {
      this.doCheck()
    }
  }

  public get impact() {
    return this.config.impact
  }

  /**
   * Run one check cycle depending on the configured mode.
   * For polled/async, this is called automatically.
   */
  private async doCheck() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    if (this.isDisposed) {
      return
    }

    if (this.config.syncCall) {
      await this.doSyncCheck()
    } else {
      this.doAsyncCheck()
    }
  }

  /**
   * Executes a synchronous (inline/polled) check and updates internal state.
   */
  private async doSyncCheck() {
    const start = Date.now()

    const { syncCall, timeout } = this.config as SyncInlineConfig
    const { pollRate, retryRate } = this.config as SyncPolledConfig
    try {
      this.status = await runAgainstTimeout(syncCall(), timeout)

      const end = new Date()
      this.freshness = {
        lastChecked: end.toISOString(),
        lastSuccess: end.toISOString(),
      }

      this.observed = {
        latencyMs: end.getTime() - start,
      }
    } catch (_err) {
      this.status = 'error'
      this.observed = undefined

      const end = new Date()
      if (this.freshness) {
        this.freshness.lastChecked = end.toISOString()
      } else {
        this.freshness = {
          lastChecked: end.toISOString(),
          lastSuccess: null,
        }
      }
    }

    if (this.config.pollRate && !this.isDisposed) {
      const delay = this.status === 'error' ? retryRate || pollRate : pollRate
      this.timeout = setTimeout(() => this.doCheck(), delay)
    }
  }

  /**
   * Executes an asynchronous check (async mode).
   * The dependency must call `reportResponse` to provide a result.
   */
  private async doAsyncCheck() {
    const start = Date.now()
    this.config.asyncCall?.((status) => {
      const end = new Date()
      this.status = status
      this.freshness = {
        lastChecked: end.toISOString(),
        lastSuccess: status !== 'error' ? end.toISOString() : null,
      }
      this.observed =
        status !== 'error' ? { latencyMs: end.getTime() - start } : undefined

      if (!this.isDisposed) {
        this.timeout = setTimeout(() => this.doCheck(), this.config.pollRate)
      }
    })
  }

  /**
   * Returns the current dependency check result.
   * - In inline mode: executes the `syncCall`.
   * - In polled/async mode: returns the cached result.
   */
  public async check(): Promise<DependencyCheck> {
    if (this.isDisposed) {
      throw new Error('DependencyMonitor has been disposed')
    }

    if (this.mode === 'inline') {
      await this.doCheck()
    }

    const result: DependencyCheck = {
      status: this.status as StatusValue,
      impact: this.config.impact,
      mode: this.mode,
      freshness: this.freshness as Freshness,
      observed: this.observed,
    }

    return result
  }

  /**
   * Symbol-based disposer so the monitor can be used with `using`.
   */
  public [Symbol.dispose]() {
    this.dispose()
  }

  /**
   * Disposes the monitor:
   * - clears timers
   * - prevents further checks
   */
  public dispose() {
    this.isDisposed = true
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  }
}
