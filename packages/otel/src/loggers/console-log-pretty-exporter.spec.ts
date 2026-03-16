import { HrTime } from '@opentelemetry/api'
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

function createRealisticLogRecord(
  severityText: LOG_SEVERITY_NAME,
  body: string,
  attrs: Record<string, unknown> = {},
  componentOverride?: string
): ReadableLogRecord {
  return {
    severityNumber: LOG_SEVERITY_MAP[severityText],
    severityText,
    body,
    attributes: {
      'cloud.orchestrator': 'kubernetes',
      'component.name': componentOverride ?? 'core',
      ...attrs,
    },
    resource: {
      attributes: {
        [ATTR_SERVICE_NAME]: 'core',
        [ATTR_SERVICE_VERSION]: '1.0.0',
        'component.name': componentOverride ?? 'core',
        'cloud.orchestrator': 'kubernetes',
      },
    } as any,
    instrumentationScope: {
      name: componentOverride ?? 'core',
      version: '1.0.0',
    },
    hrTime: [Math.floor(Date.now() / 1000), 78000000] as HrTime,
    hrTimeObserved: [Math.floor(Date.now() / 1000), 78000000] as HrTime,
    droppedAttributesCount: 0,
  }
}
describe('ConsoleLogPrettyExporter', () => {
  const OLD_ENV = process.env
  let consoleTrace: MockInstance
  let consoleDebug: MockInstance
  let consoleInfo: MockInstance
  let consoleWarn: MockInstance
  let consoleError: MockInstance

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    consoleTrace = vi.spyOn(console, 'trace').mockImplementation(() => {})
    consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    // Print captured output so it's visible in test results
    for (const spy of [
      consoleTrace,
      consoleDebug,
      consoleInfo,
      consoleWarn,
      consoleError,
    ]) {
      for (const call of spy.mock.calls) {
        process.stdout.write(`${call[0]}\n`)
      }
    }
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

    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringContaining('Log at INFO')
    )
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Log at ERROR')
    )
  })
  it('should honor LOG_LEVEL=DEBUG and include DEBUG logs', () => {
    process.env.LOG_LEVEL = 'debug'
    const exporter = new ConsoleLogPrettyExporter()

    const logs: ReadableLogRecord[] = [
      createLogRecord('DEBUG'),
      createLogRecord('INFO'),
    ]

    exporter.export(logs, () => {})

    expect(consoleDebug).toHaveBeenCalledOnce()
    expect(consoleInfo).toHaveBeenCalledOnce()
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

    expect(consoleDebug).not.toHaveBeenCalled()
    expect(consoleInfo).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
  })
  it('should fallback to INFO if LOG_LEVEL is invalid', () => {
    process.env.LOG_LEVEL = 'made-up'
    const exporter = new ConsoleLogPrettyExporter()

    const logs: ReadableLogRecord[] = [
      createLogRecord('DEBUG'),
      createLogRecord('INFO'),
    ]

    exporter.export(logs, () => {})

    expect(consoleDebug).toHaveBeenCalledTimes(0)
    expect(consoleInfo).toHaveBeenCalledTimes(1)
  })

  it('should not duplicate scope when component matches service name', () => {
    process.env.LOG_LEVEL = 'debug'
    const exporter = new ConsoleLogPrettyExporter()

    const logs: ReadableLogRecord[] = [
      createRealisticLogRecord('INFO', 'Starting server'),
      createRealisticLogRecord('DEBUG', 'request', {
        url: '/v3/ping',
        params: '{}',
      }),
      createRealisticLogRecord('ERROR', 'Connection timeout'),
      createRealisticLogRecord('WARNING', 'Persistor class is deprecated'),
    ]

    exporter.export(logs, () => {})

    // Scope "core@1.0.0" should NOT appear after severity (since it matches service name)
    for (const spy of [consoleInfo, consoleDebug, consoleError, consoleWarn]) {
      for (const call of spy.mock.calls) {
        const output = call[0] as string
        // service header [core@1.0.0] is fine, but scope should not duplicate it
        const afterSeverity = output.replace(
          /^.*?(INFO|DEBUG|ERROR|WARNING)\s*/,
          ''
        )
        expect(afterSeverity).not.toMatch(/^core@1\.0\.0\s/)
      }
    }
  })

  it('should not show cloud.orchestrator or component.name in attributes', () => {
    process.env.LOG_LEVEL = 'debug'
    const exporter = new ConsoleLogPrettyExporter()

    const logs: ReadableLogRecord[] = [
      createRealisticLogRecord('INFO', 'Starting server', {
        url: '/health',
      }),
    ]

    exporter.export(logs, () => {})

    const output = consoleInfo.mock.calls[0][0] as string
    expect(output).not.toContain('cloud.orchestrator')
    expect(output).not.toContain('component.name')
    expect(output).toContain('url=/health')
  })
})
