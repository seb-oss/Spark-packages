import type { DependencyCheck, Impact, Mode, Status, StatusValue } from './types'

type BaseConfig = {
  impact: Impact
  pollRate?: number // ms
}

type SyncInlineConfig = BaseConfig & {
  syncCall: () => Promise<StatusValue>
  asyncCall?: never
  pollRate?: undefined
}

type SyncPolledConfig = BaseConfig & {
  syncCall: () => Promise<StatusValue>
  pollRate: number
  asyncCall?: never
}

type AsyncConfig = BaseConfig & {
  asyncCall: (reportResponse: (status: StatusValue) => void | Promise<void>) => void | Promise<void>
  pollRate: number
  syncCall?: never
}

export type DependencyMonitorConfig = SyncInlineConfig | SyncPolledConfig | AsyncConfig

export class DependencyMonitor {
  private readonly config: DependencyMonitorConfig
  private readonly mode: Mode

  constructor(config: DependencyMonitorConfig) {
    this.config = config

    this.mode = (config.asyncCall) ? 'async' : (config.pollRate) ? 'polled' : 'inline'
  }

  private async doCheck() {
    const status = await this.config.syncCall?.() as StatusValue
    return status
  }

  public async check() {
    const status = await this.doCheck()
    const result: DependencyCheck = {
      status,
      impact: this.config.impact,
      mode: this.mode,
      freshness: {
        lastChecked: new Date().toISOString(),
        lastSuccess: new Date().toISOString(),
        ttlMs: 10000,
        isStale: false,
      }
    }

    return result
  }
}
