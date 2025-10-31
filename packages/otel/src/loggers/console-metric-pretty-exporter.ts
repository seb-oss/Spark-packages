import { type ExportResult, ExportResultCode } from '@opentelemetry/core'
import type {
  PushMetricExporter,
  ResourceMetrics,
} from '@opentelemetry/sdk-metrics'
import { formatMetrics } from './formatters/index.js'

export class ConsoleMetricPrettyExporter implements PushMetricExporter {
  private readonly patterns: RegExp[]

  constructor() {
    const raw = process.env.METRIC_FILTER ?? ''
    const entries = raw
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)

    this.patterns = entries.map(globToRegex)
  }

  private filterMetrics(
    resourceMetrics: ResourceMetrics
  ): ResourceMetrics | undefined {
    // No filter = block all metrics
    if (this.patterns.length === 0) return undefined

    const filteredScopes = resourceMetrics.scopeMetrics
      .map((scopeMetric) => {
        const filteredMetrics = scopeMetric.metrics.filter((metric) =>
          this.patterns.some((pattern) => pattern.test(metric.descriptor.name))
        )

        if (filteredMetrics.length === 0) return undefined

        return {
          ...scopeMetric,
          metrics: filteredMetrics,
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== undefined)

    if (filteredScopes.length === 0) return undefined

    return {
      ...resourceMetrics,
      scopeMetrics: filteredScopes,
    }
  }

  export(
    metrics: ResourceMetrics,
    resultCallback: (result: ExportResult) => void
  ): void {
    const filtered = this.filterMetrics(metrics)
    if (filtered) {
      console.log(formatMetrics(filtered))
    }
    resultCallback({ code: ExportResultCode.SUCCESS })
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }
}

function globToRegex(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const regex = `^${escaped.replace(/\*/g, '.*')}$`
  return new RegExp(regex)
}
