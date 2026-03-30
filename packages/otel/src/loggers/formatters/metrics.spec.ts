import { Resource } from '@opentelemetry/resources'
import {
  DataPointType,
  type MetricData,
  type ResourceMetrics,
  type ScopeMetrics,
  type SumMetricData,
} from '@opentelemetry/sdk-metrics'
import { describe, expect, it } from 'vitest'
import { formatMetrics } from './metrics'

const createMetricWithValue = (name: string, value: unknown): MetricData =>
  ({
    descriptor: {
      name,
      description: '',
      unit: '',
      type: 0,
      valueType: 0,
    },
    dataPointType: DataPointType.SUM,
    isMonotonic: false,
    dataPoints: [
      {
        startTime: [0, 0],
        endTime: [0, 0],
        value,
        attributes: {},
      },
    ],
  }) as Partial<SumMetricData> as SumMetricData

const createResourceMetrics = (metrics: MetricData[]): ResourceMetrics =>
  ({
    resource: {
      attributes: {
        'service.name': 'test-service',
      },
    } as Partial<Resource> as Resource,
    scopeMetrics: [
      {
        scope: { name: 'test-lib', version: '1.0.0' },
        metrics,
      },
    ] as ScopeMetrics[],
  }) as Partial<ResourceMetrics> as ResourceMetrics

describe('formatMetrics', () => {
  it('formats a datapoint with a numeric value', () => {
    const metrics = createResourceMetrics([
      createMetricWithValue('my.counter', 42),
    ])
    const result = formatMetrics(metrics)
    expect(result).toContain('my.counter')
    expect(result).toContain('42')
  })

  it('formats a datapoint with a histogram-like value containing sum', () => {
    const metrics = createResourceMetrics([
      createMetricWithValue('my.histogram', { sum: 123, count: 5 }),
    ])
    const result = formatMetrics(metrics)
    expect(result).toContain('my.histogram')
    expect(result).toContain('123')
  })

  it('handles datapoint with undefined attributes (uses empty object fallback)', () => {
    const metric = createMetricWithValue('no.attrs', 1)
    ;(metric.dataPoints[0] as any).attributes = undefined
    const result = formatMetrics(createResourceMetrics([metric]))
    expect(result).toContain('no.attrs')
  })

  it('formats a datapoint with a complex value (object without sum) as [complex]', () => {
    const metrics = createResourceMetrics([
      createMetricWithValue('my.complex', { buckets: [1, 2, 3] }),
    ])
    const result = formatMetrics(metrics)
    expect(result).toContain('my.complex')
    expect(result).toContain('[complex]')
  })
})
