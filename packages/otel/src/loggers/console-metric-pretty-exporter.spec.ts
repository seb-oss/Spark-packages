import { Resource } from '@opentelemetry/resources'
import {
  DataPointType,
  type MetricData,
  type ResourceMetrics,
  type ScopeMetrics,
  type SumMetricData,
} from '@opentelemetry/sdk-metrics'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest'
import { ConsoleMetricPrettyExporter } from './console-metric-pretty-exporter.js'

describe('ConsoleMetricPrettyExporter', () => {
  const createMetric = (name: string): MetricData =>
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
          value: 42,
          attributes: {},
        },
      ],
    }) as Partial<SumMetricData> as SumMetricData

  const createResourceMetrics = (metricNames: string[]): ResourceMetrics =>
    ({
      resource: {
        attributes: {
          'service.name': 'test-service',
        },
      } as Partial<Resource> as Resource,
      scopeMetrics: [
        {
          scope: { name: 'test-lib', version: '1.0.0' },
          metrics: metricNames.map(createMetric),
        },
      ] as ScopeMetrics[],
    }) as Partial<ResourceMetrics> as ResourceMetrics

  let consoleLog: MockInstance

  beforeEach(() => {
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => {
    consoleLog.mockRestore()
    delete process.env.METRIC_FILTER
  })
  it('blocks all metrics if METRIC_FILTER is empty', () => {
    const exporter = new ConsoleMetricPrettyExporter()
    const metrics = createResourceMetrics([
      'http.server.duration',
      'db.query.count',
    ])

    exporter.export(metrics, () => {})

    expect(consoleLog).not.toHaveBeenCalled()
  })
  it('includes only matching metrics', () => {
    process.env.METRIC_FILTER = 'http.*'
    const exporter = new ConsoleMetricPrettyExporter()
    const metrics = createResourceMetrics([
      'http.server.duration',
      'db.query.count',
    ])

    exporter.export(metrics, () => {})

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining('http.server.duration')
    )
    expect(consoleLog).not.toHaveBeenCalledWith(
      expect.stringContaining('db.query.count')
    )
  })
  it('includes multiple filters', () => {
    process.env.METRIC_FILTER = 'http.*,db.*'
    const exporter = new ConsoleMetricPrettyExporter()
    const metrics = createResourceMetrics([
      'http.server.duration',
      'db.query.count',
      'cache.hit',
    ])

    exporter.export(metrics, () => {})

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining('http.server.duration')
    )
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining('db.query.count')
    )
    expect(consoleLog).not.toHaveBeenCalledWith(
      expect.stringContaining('cache.hit')
    )
  })
  it('ignores unmatched filters', () => {
    process.env.METRIC_FILTER = 'xyz.*'
    const exporter = new ConsoleMetricPrettyExporter()
    const metrics = createResourceMetrics(['http.server.duration'])

    exporter.export(metrics, () => {})

    expect(consoleLog).not.toHaveBeenCalled()
  })
  it('matches exact name if no wildcard', () => {
    process.env.METRIC_FILTER = 'db.query.count'
    const exporter = new ConsoleMetricPrettyExporter()
    const metrics = createResourceMetrics(['db.query.count', 'db.insert.count'])

    exporter.export(metrics, () => {})

    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining('db.query.count')
    )
    expect(consoleLog).not.toHaveBeenCalledWith(
      expect.stringContaining('db.insert.count')
    )
  })
})
