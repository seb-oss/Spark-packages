import type { Resource } from '@opentelemetry/resources'
import type {
  DataPoint,
  MetricData,
  ResourceMetrics,
  ScopeMetrics,
} from '@opentelemetry/sdk-metrics'
import {
  formatAttributes,
  formatScope,
  formatService,
  formatTimestamp,
} from './shared'
import { colors } from './style'

export function formatMetrics(resourceMetrics: ResourceMetrics): string {
  const { resource, scopeMetrics } = resourceMetrics

  return scopeMetrics
    .map((scopeMetric) => formatScopeMetric(scopeMetric, resource))
    .join('\n')
}

function formatScopeMetric(
  scopeMetric: ScopeMetrics,
  resource: Resource
): string {
  return scopeMetric.metrics
    .map((metric: MetricData) =>
      formatMetricData(metric, resource, scopeMetric.scope)
    )
    .join('\n')
}

function formatMetricData(
  metric: MetricData,
  resource: Resource,
  scope: ScopeMetrics['scope']
): string {
  const scopeStr = formatScope(resource, scope)
  const serviceStr = formatService(resource)

  const lines: string[] = []

  for (const dp of metric.dataPoints) {
    const ts = formatTimestamp(dp.startTime)
    const value = extractMetricValue(dp)
    const attrs = formatAttributes(dp.attributes ?? {})

    lines.push(
      `${serviceStr} ${ts}  📊  ${scopeStr}${colors.white(metric.descriptor.name)} ${colors.dim(value)}${attrs}`
    )
  }

  return lines.join('\n')
}

function extractMetricValue(dp: DataPoint<unknown>): string {
  const value = dp.value

  if (typeof value === 'number') {
    return value.toString()
  }

  if (isHistogramLike(value)) {
    return value.sum.toString()
  }

  return '[complex]'
}

function isHistogramLike(val: unknown): val is { sum: number } {
  return (
    typeof val === 'object' &&
    val !== null &&
    'sum' in val &&
    typeof (val as { sum: number }).sum === 'number'
  )
}
