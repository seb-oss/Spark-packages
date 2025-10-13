import { HrTime } from '@opentelemetry/api'
import type { ReadableLogRecord } from '@opentelemetry/sdk-logs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOG_SEVERITY_MAP, LOG_SEVERITY_NAME } from '../consts'
import { ConsoleLogPrettyExporter } from './console-log-pretty-exporter'

function createLogRecord(severityText: LOG_SEVERITY_NAME): ReadableLogRecord {
  return {
    severityNumber: LOG_SEVERITY_MAP[severityText],
    severityText,
    body: { value: `Log at ${severityText}` },
    attributes: {},
    resource: { attributes: {} } as any,
    instrumentationScope: { name: 'test', version: '1.0.0' },
    hrTime: [0, 0] as HrTime,
    hrTimeObserved: [0, 0] as HrTime,
    droppedAttributesCount: 0,
  }
}
describe('ConsoleLogPrettyExporter', () => {
  const OLD_ENV = process.env
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    process.env = OLD_ENV
  })
  it('should default to INFO level and print INFO and above', () => {
    const exporter = new ConsoleLogPrettyExporter()

    const logs: ReadableLogRecord[] = [
      createLogRecord('DEBUG'), // below
      createLogRecord('INFO'), // match
      createLogRecord('ERROR'), // match
    ]

    exporter.export(logs, () => {})

    expect(consoleSpy).toHaveBeenCalledTimes(2)
    expect(consoleSpy.mock.calls[0][0]).toContain('Log at INFO')
    expect(consoleSpy.mock.calls[1][0]).toContain('Log at ERROR')
  })
  it('should honor LOG_LEVEL=DEBUG and include DEBUG logs', () => {
    process.env.LOG_LEVEL = 'debug'
    const exporter = new ConsoleLogPrettyExporter()

    const logs: ReadableLogRecord[] = [
      createLogRecord('DEBUG'),
      createLogRecord('INFO'),
    ]

    exporter.export(logs, () => {})

    expect(consoleSpy).toHaveBeenCalledTimes(2)
  })
  it('should ignore all logs if LOG_LEVEL=FATAL and only ERROR is logged', () => {
    process.env.LOG_LEVEL = 'fatal'
    const exporter = new ConsoleLogPrettyExporter()

    const logs: ReadableLogRecord[] = [
      createLogRecord('DEBUG'),
      createLogRecord('INFO'),
      createLogRecord('ERROR'),
    ]

    exporter.export(logs, () => {})

    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })
  it('should fallback to INFO if LOG_LEVEL is invalid', () => {
    process.env.LOG_LEVEL = 'made-up'
    const exporter = new ConsoleLogPrettyExporter()

    const logs: ReadableLogRecord[] = [
      createLogRecord('DEBUG'),
      createLogRecord('INFO'),
    ]

    exporter.export(logs, () => {})

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    expect(consoleSpy.mock.calls[0][0]).toContain('Log at INFO')
  })
})
