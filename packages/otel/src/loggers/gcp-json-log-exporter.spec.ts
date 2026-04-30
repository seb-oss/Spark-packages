import type { HrTime } from '@opentelemetry/api'
import type { ReadableLogRecord } from '@opentelemetry/sdk-logs'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from 'vitest'
import { LOG_SEVERITY_MAP, type LOG_SEVERITY_NAME } from '../consts'
import { GcpJsonLogExporter } from './gcp-json-log-exporter'

function createLogRecord(
  severityText: LOG_SEVERITY_NAME,
  overrides: Partial<ReadableLogRecord> = {}
): ReadableLogRecord {
  return {
    severityNumber: LOG_SEVERITY_MAP[severityText],
    severityText,
    body: `Log at ${severityText}`,
    attributes: {},
    resource: {
      attributes: {
        [ATTR_SERVICE_NAME]: 'test-service',
        [ATTR_SERVICE_VERSION]: '2.0.0',
      },
    } as any,
    instrumentationScope: { name: 'test', version: '1.0.0' },
    hrTime: [1710590528, 78000000] as HrTime,
    hrTimeObserved: [1710590528, 78000000] as HrTime,
    droppedAttributesCount: 0,
    ...overrides,
  }
}

describe('GcpJsonLogExporter', () => {
  const OLD_ENV = process.env
  let stdoutWrite: MockInstance

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    stdoutWrite = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
  })

  afterEach(() => {
    // Print captured output so it's visible in test results
    for (const call of stdoutWrite.mock.calls) {
      const line = (call[0] as string).trim()
      console.log(JSON.stringify(JSON.parse(line), null, 2))
    }
    vi.restoreAllMocks()
    process.env = OLD_ENV
  })

  it('should output valid JSON lines to stdout', () => {
    const exporter = new GcpJsonLogExporter()
    const logs = [createLogRecord('INFO')]

    exporter.export(logs, () => {})

    expect(stdoutWrite).toHaveBeenCalledOnce()
    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)
    expect(parsed).toBeDefined()
  })

  it('should map severity correctly for GCP', () => {
    process.env.LOG_LEVEL = 'DEBUG'
    const exporter = new GcpJsonLogExporter()

    const cases: [LOG_SEVERITY_NAME, string][] = [
      ['DEBUG', 'DEBUG'],
      ['INFO', 'INFO'],
      ['WARNING', 'WARNING'],
      ['WARN', 'WARNING'],
      ['ERROR', 'ERROR'],
      ['CRITICAL', 'CRITICAL'],
      ['FATAL', 'CRITICAL'],
      ['ALERT', 'ALERT'],
      ['EMERGENCY', 'EMERGENCY'],
    ]

    for (const [otelSeverity, gcpSeverity] of cases) {
      stdoutWrite.mockClear()
      exporter.export([createLogRecord(otelSeverity)], () => {})
      const output = (stdoutWrite.mock.calls[0][0] as string).trim()
      const parsed = JSON.parse(output)
      expect(parsed.severity).toBe(gcpSeverity)
    }
  })

  it('should include message and time', () => {
    const exporter = new GcpJsonLogExporter()
    exporter.export([createLogRecord('INFO')], () => {})

    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)

    expect(parsed.message).toBe('Log at INFO')
    expect(parsed.time).toBeDefined()
    expect(new Date(parsed.time).toISOString()).toBe(parsed.time)
  })

  it('should include serviceContext', () => {
    const exporter = new GcpJsonLogExporter()
    exporter.export([createLogRecord('INFO')], () => {})

    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)

    expect(parsed.serviceContext).toEqual({
      service: 'test-service',
      version: '2.0.0',
    })
  })

  it('should include trace correlation when GCP_PROJECT and trace_id are set', () => {
    process.env.GCP_PROJECT = 'my-gcp-project'
    const exporter = new GcpJsonLogExporter()

    const record = createLogRecord('INFO', {
      attributes: {
        trace_id: 'abc123def456',
        span_id: 'span789',
      },
    })

    exporter.export([record], () => {})

    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)

    expect(parsed['logging.googleapis.com/trace']).toBe(
      'projects/my-gcp-project/traces/abc123def456'
    )
    expect(parsed['logging.googleapis.com/spanId']).toBe('span789')
  })

  it('should output raw trace_id when GCP_PROJECT is not set', () => {
    delete process.env.GCP_PROJECT
    delete process.env.GOOGLE_CLOUD_PROJECT
    const exporter = new GcpJsonLogExporter()

    const record = createLogRecord('INFO', {
      attributes: { trace_id: 'abc123' },
    })

    exporter.export([record], () => {})

    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)

    expect(parsed['logging.googleapis.com/trace']).toBe('abc123')
  })

  it('should put custom attributes in logging.googleapis.com/labels', () => {
    const exporter = new GcpJsonLogExporter()

    const record = createLogRecord('INFO', {
      attributes: {
        url: '/v3/ping',
        params: '{}',
      },
    })

    exporter.export([record], () => {})

    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)

    expect(parsed['logging.googleapis.com/labels']).toEqual({
      url: '/v3/ping',
      params: '{}',
    })
  })

  it('should exclude internal attributes from labels', () => {
    const exporter = new GcpJsonLogExporter()

    const record = createLogRecord('INFO', {
      attributes: {
        trace_id: 'abc',
        span_id: 'def',
        'service.name': 'should-exclude',
        'serviceContext.service': 'should-exclude',
        'component.name': 'should-exclude',
        'cloud.orchestrator': 'should-exclude',
        custom_key: 'should-include',
      },
    })

    exporter.export([record], () => {})

    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)

    expect(parsed['logging.googleapis.com/labels']).toEqual({
      custom_key: 'should-include',
    })
  })

  it('should respect LOG_LEVEL threshold', () => {
    process.env.LOG_LEVEL = 'ERROR'
    const exporter = new GcpJsonLogExporter()

    const logs = [
      createLogRecord('DEBUG'),
      createLogRecord('INFO'),
      createLogRecord('WARNING'),
      createLogRecord('ERROR'),
    ]

    exporter.export(logs, () => {})

    // Only ERROR should be output
    expect(stdoutWrite).toHaveBeenCalledOnce()
    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)
    expect(parsed.severity).toBe('ERROR')
  })

  it('should default to INFO level when LOG_LEVEL is not set', () => {
    delete process.env.LOG_LEVEL
    const exporter = new GcpJsonLogExporter()

    const logs = [createLogRecord('DEBUG'), createLogRecord('INFO')]

    exporter.export(logs, () => {})

    expect(stdoutWrite).toHaveBeenCalledOnce()
    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)
    expect(parsed.message).toBe('Log at INFO')
  })

  it('should not include labels key when there are no custom attributes', () => {
    const exporter = new GcpJsonLogExporter()
    exporter.export([createLogRecord('INFO')], () => {})

    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)

    expect(parsed['logging.googleapis.com/labels']).toBeUndefined()
  })

  it('shutdown resolves', async () => {
    const exporter = new GcpJsonLogExporter()
    await expect(exporter.shutdown()).resolves.toBeUndefined()
  })

  it('forceFlush resolves', async () => {
    const exporter = new GcpJsonLogExporter()
    await expect(exporter.forceFlush()).resolves.toBeUndefined()
  })

  it('should use GOOGLE_CLOUD_PROJECT as fallback for GCP_PROJECT', () => {
    delete process.env.GCP_PROJECT
    process.env.GOOGLE_CLOUD_PROJECT = 'fallback-project'
    const exporter = new GcpJsonLogExporter()

    const record = createLogRecord('INFO', {
      attributes: { trace_id: 'trace123' },
    })

    exporter.export([record], () => {})

    const output = (stdoutWrite.mock.calls[0][0] as string).trim()
    const parsed = JSON.parse(output)

    expect(parsed['logging.googleapis.com/trace']).toBe(
      'projects/fallback-project/traces/trace123'
    )
  })

  it('should fall back to INFO threshold when LOG_LEVEL is unrecognised', () => {
    process.env.LOG_LEVEL = 'NOTAVALIDLEVEL'
    const exporter = new GcpJsonLogExporter()

    const logs = [createLogRecord('DEBUG'), createLogRecord('INFO')]
    exporter.export(logs, () => {})

    expect(stdoutWrite).toHaveBeenCalledOnce()
    const parsed = JSON.parse((stdoutWrite.mock.calls[0][0] as string).trim())
    expect(parsed.message).toBe('Log at INFO')
  })

  it('should skip records below the log threshold', () => {
    const exporter = new GcpJsonLogExporter()
    exporter.export([createLogRecord('DEBUG')], () => {})
    expect(stdoutWrite).not.toHaveBeenCalled()
  })

  it('should JSON-stringify non-string body', () => {
    const exporter = new GcpJsonLogExporter()
    exporter.export(
      [createLogRecord('INFO', { body: { foo: 'bar' } })],
      () => {}
    )
    const parsed = JSON.parse((stdoutWrite.mock.calls[0][0] as string).trim())
    expect(parsed.message).toBe('{"foo":"bar"}')
  })

  it('should default serviceVersion to 1.0.0 when not set', () => {
    const exporter = new GcpJsonLogExporter()
    const record = createLogRecord('INFO', {
      resource: {
        attributes: { [ATTR_SERVICE_NAME]: 'svc' },
      } as any,
    })
    exporter.export([record], () => {})
    const parsed = JSON.parse((stdoutWrite.mock.calls[0][0] as string).trim())
    expect(parsed.serviceContext.version).toBe('1.0.0')
  })

  it('should default severity to DEFAULT for unknown severityText', () => {
    const exporter = new GcpJsonLogExporter()
    const record = createLogRecord('INFO', { severityText: 'CUSTOM_LEVEL' })
    exporter.export([record], () => {})
    const parsed = JSON.parse((stdoutWrite.mock.calls[0][0] as string).trim())
    expect(parsed.severity).toBe('DEFAULT')
  })

  it('should fall back to INFO severityText when severityText is missing', () => {
    const exporter = new GcpJsonLogExporter()
    const record = createLogRecord('INFO', { severityText: undefined })
    exporter.export([record], () => {})
    const parsed = JSON.parse((stdoutWrite.mock.calls[0][0] as string).trim())
    expect(parsed.severity).toBe('INFO')
  })

  it('should JSON-stringify object attribute values in labels', () => {
    const exporter = new GcpJsonLogExporter()
    const record = createLogRecord('INFO', {
      attributes: { meta: { key: 'val' } } as any,
    })
    exporter.export([record], () => {})
    const parsed = JSON.parse((stdoutWrite.mock.calls[0][0] as string).trim())
    expect(parsed['logging.googleapis.com/labels'].meta).toBe('{"key":"val"}')
  })

  it('should treat missing severityNumber as 0 (passes INFO threshold)', () => {
    const exporter = new GcpJsonLogExporter()
    const record = createLogRecord('INFO', { severityNumber: undefined })
    exporter.export([record], () => {})
    expect(stdoutWrite).not.toHaveBeenCalled()
  })

  it('should use unknown-service when serviceName is absent', () => {
    const exporter = new GcpJsonLogExporter()
    const record = createLogRecord('INFO', {
      resource: { attributes: {} } as any,
    })
    exporter.export([record], () => {})
    const parsed = JSON.parse((stdoutWrite.mock.calls[0][0] as string).trim())
    expect(parsed.serviceContext.service).toBe('unknown-service')
  })
})
