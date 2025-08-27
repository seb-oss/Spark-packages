import preformance from 'node:perf_hooks'
import {
  TimeoutError,
  UnknownError,
  type CheckError,
  type DependencyCheck,
  type DependencyStatusValue,
  type Freshness,
  type Impact,
  type Mode,
  type Observed,
  type StatusValue,
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

  /**
   * Maximum response time in milliseconds considered healthy.
   * - A call resolving within this time window **and** returning `"ok"` → status `"ok"`
   * - A call resolving after this but **before** `timeoutLimitMs` → status `"degraded"`
   */
  healthyLimitMs: number

  /**
   * Absolute upper bound in milliseconds; beyond this a call is considered `"error"`.
   * - Inline: the awaited call is raced with a timeout and rejected past this limit
   * - Polled/Async: escalate `unknown` → `degraded` at `healthyLimitMs`, then `"error"` at `timeoutLimitMs`
   * - Any late `"ok"` result after this limit is ignored
   */
  timeoutLimitMs: number
}

/**
 * Inline mode configuration (no polling).
 * `syncCall` runs **only** when {@link DependencyMonitor.check} is invoked.
 */
export type SyncInlineConfig = BaseConfig & {
  /** Performs the check immediately when {@link DependencyMonitor.check} is called. */
  syncCall: () => Promise<DependencyStatusValue | Error>
  asyncCall?: never
  pollRate?: undefined
  retryRate?: undefined
}

/**
 * Polled mode configuration.
 * `syncCall` runs on an interval (`pollRate`) and results are cached.
 */
export type SyncPolledConfig = BaseConfig & {
  /** Performs the check at each poll interval. */
  syncCall: () => Promise<DependencyStatusValue | Error>
  /** Polling interval in milliseconds. */
  pollRate: number
  asyncCall?: never
}

/**
 * Async mode configuration.
 * `asyncCall` starts a check and must report via the provided callback.
 */
export type AsyncConfig = BaseConfig & {
  /**
   * Starts an asynchronous check. Must call `reportResponse` once a result is available.
   * The callback may be invoked with a `DependencyStatusValue` or an `Error`.
   */
  asyncCall: (
    reportResponse: (status: DependencyStatusValue | Error) => void | Promise<void>
  ) => void | Promise<void>
  /** Polling interval in milliseconds. */
  pollRate: number
  syncCall?: never
}

/**
 * Discriminated configuration for a dependency monitor.
 * - {@link SyncInlineConfig} → inline checks on demand
 * - {@link SyncPolledConfig} → synchronous checks on a fixed interval
 * - {@link AsyncConfig} → asynchronous checks that report back via callback
 */
export type DependencyMonitorConfig =
  | SyncInlineConfig
  | SyncPolledConfig
  | AsyncConfig

/**
 * Tracks the health of a single dependency in one of three modes:
 *
 * - **inline**: `syncCall` executed only when {@link check} is called
 * - **polled**: `syncCall` executed on `pollRate`; latest result cached
 * - **async**: `asyncCall` executed on `pollRate`, result returned via callback
 *
 * The monitor:
 * - classifies results using `healthyLimitMs` and `timeoutLimitMs`
 * - records freshness (`lastChecked`, `lastSuccess`)
 * - records observed latency (ms) when applicable
 *
 * Status interpretation:
 * - `"ok"` only if returned `"ok"` **and** latency ≤ `healthyLimitMs`
 * - `"degraded"` if returned `"degraded"` **or** latency > `healthyLimitMs` but ≤ `timeoutLimitMs`
 * - `"error"` if returned `"error"`, an `Error`, or exceeded `timeoutLimitMs`
 * - `"unknown"` is the initial state before first successful/failed result (polled/async)
 */
export class DependencyMonitor {
  /** Immutable configuration for this monitor. */
  private readonly config: DependencyMonitorConfig
  /** Operational mode determined from the configuration. */
  private readonly mode: Mode

  /** Last computed status (starts as `"unknown"` until first result). */
  private status: StatusValue
  /** Optional error details from the last failure. */
  private error?: CheckError
  /** Last observed metrics (e.g., latency). */
  private observed?: Observed
  /** Freshness timestamps for last check/success. */
  private freshness?: Freshness

  /** Indicates whether this monitor has been disposed. */
  private isDisposed = false
  /** Internal timer handle for polling/retry. */
  private timeout?: NodeJS.Timeout

  /**
   * Create a new {@link DependencyMonitor}.
   * @param config Monitor configuration (inline, polled, or async).
   */
  constructor(config: DependencyMonitorConfig) {
    this.config = config

    this.mode = config.asyncCall
      ? 'async'
      : config.pollRate
        ? 'polled'
        : 'inline'

    this.status = 'unknown'

    // Deduplicate concurrent inline checks (single-flight).
    if (this.mode === 'inline') {
      this.check = singleFlight(this.check.bind(this))
    }

    // Kick off the first cycle for polled/async.
    if (this.mode !== 'inline') {
      this.doCheck()
    }
  }

  /** Impact of this dependency (critical/non_critical). */
  public get impact() {
    return this.config.impact
  }

  /**
   * Run one check cycle depending on the configured mode.
   * - Inline: no-op here (runs in {@link check})
   * - Polled/Async: invoked automatically and re-scheduled as needed
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
   * Execute a synchronous (inline/polled) check and update internal state.
   * Classification:
   * - OK if `"ok"` and latency ≤ `healthyLimitMs`
   * - Degraded if `"degraded"` or latency between `(healthyLimitMs, timeoutLimitMs]`
   * - Error if `"error"`, `Error`, or timeout exceeded
   */
  private async doSyncCheck() {
    const start = performance.now()

    const { syncCall, timeoutLimitMs } = this.config as SyncInlineConfig

    try {
      const response = await runAgainstTimeout(syncCall(), timeoutLimitMs)
      const duration = performance.now() - start

      this.handleDependencyResponse(response, duration)
    } catch (err) {
      this.handleDependencyError(err as Error)
    }
  }

  /**
   * Execute an asynchronous check (async mode).
   * - Initializes timers to escalate `unknown` → `degraded` → `error`
   *   if no callback result arrives within the thresholds.
   * - On callback, clears timers and classifies the result with latency.
   */
  private async doAsyncCheck() {
    const { asyncCall, healthyLimitMs, timeoutLimitMs } = this.config as AsyncConfig

    const start = performance.now()
    let callActive = true
    let healthTimeout: NodeJS.Timeout | undefined
    let serviceTimeout: NodeJS.Timeout | undefined
    
    asyncCall((response) => {
      if (!callActive) return
      callActive = false
      clearTimeout(healthTimeout)
      clearTimeout(serviceTimeout)

      const duration = performance.now() - start
      this.handleDependencyResponse(response, duration)
    })

    // Escalate to degraded after healthy limit if still waiting.
    healthTimeout = setTimeout(() => {
      if (callActive) this.status = 'degraded'
    }, healthyLimitMs)

    // Escalate to error after timeout limit if still waiting.
    serviceTimeout = setTimeout(() => {
      if (!callActive) return
      callActive = false
      clearTimeout(healthTimeout)
      this.handleDependencyError(new TimeoutError())
    }, timeoutLimitMs)
  }

  /**
   * Normalize a successful dependency response into status + metadata.
   * @param response Returned status value or Error from the dependency
   * @param duration Measured latency in milliseconds
   */
  private handleDependencyResponse(response: DependencyStatusValue | Error, duration: number) {
    if (response instanceof Error) {
      return this.handleDependencyError(response)
    }
    if (response === 'error') {
      return this.handleDependencyError(new UnknownError())
    }

    this.error = undefined
    this.status =
      response === 'ok' && duration <= this.config.healthyLimitMs
        ? 'ok'
        : 'degraded'

    const end = new Date()
    this.freshness = {
      lastChecked: end.toISOString(),
      lastSuccess: end.toISOString(),
    }

    this.observed = { latencyMs: duration }

    // Schedule next poll if applicable.
    if (this.config.pollRate && !this.isDisposed) {
      const delay = this.config.pollRate
      this.timeout = setTimeout(() => this.doCheck(), delay)
    }
  }

  /**
   * Normalize a failed dependency result into `"error"` and update metadata.
   * @param error Error thrown/returned or synthesized (e.g., timeout)
   */
  private handleDependencyError(error: Error & { code?: string }) {
    this.status = 'error'
    this.observed = undefined
    this.error = {
      code: error.code || 'UNKNOWN',
      message: error.message
    }

    const end = new Date()
    if (this.freshness) {
      this.freshness.lastChecked = end.toISOString()
    } else {
      this.freshness = { lastChecked: end.toISOString(), lastSuccess: null }
    }

    // Schedule retry/poll if configured.
    if ((this.config.retryRate || this.config.pollRate) && !this.isDisposed) {
      const delay = this.config.retryRate || this.config.pollRate
      this.timeout = setTimeout(() => this.doCheck(), delay)
    }
  }

  /**
   * Get a snapshot of the dependency’s current health.
   * - Inline mode: executes the `syncCall` (single-flight guarded)
   * - Polled/Async: returns the cached result
   * @throws if the monitor has been disposed
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
      error: this.error,
    }

    return result
  }

  /** Symbol-based disposer for use with `using`. */
  public [Symbol.dispose]() {
    this.dispose()
  }

  /**
   * Dispose the monitor:
   * - Clears any scheduled timers
   * - Prevents further checks from running
   */
  public dispose() {
    this.isDisposed = true
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  }
}
