import { context, trace } from '@opentelemetry/api'
import { logs } from '@opentelemetry/api-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  InMemoryLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLogger, initialize } from './'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('getLogger', () => {
  it('does not throw if OTEL is not yet initialized at initialization', () => {
    expect(() => getLogger()).not.toThrow()
  })
  it('warns if OTEL is not yet initialized at first log call', () => {
    const warn = vi.spyOn(console, 'warn')
    const log = vi.spyOn(console, 'log')

    expect(() => getLogger().info('hello')).not.toThrow()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('OTEL must be initialized')
    )
    expect(log).toHaveBeenCalledWith('[INFO] hello')

    warn.mockRestore()
    log.mockRestore()
  })

  describe('after initialize()', () => {
    let exporter: InMemoryLogRecordExporter
    let provider: LoggerProvider

    beforeEach(async () => {
      await initialize()

      exporter = new InMemoryLogRecordExporter()
      provider = new LoggerProvider({
        resource: resourceFromAttributes({
          [ATTR_SERVICE_NAME]: 'test-service',
        }),
        processors: [new SimpleLogRecordProcessor(exporter)],
      })

      // Overwrite logger provider
      logs.disable()
      logs.setGlobalLoggerProvider(provider)
    })
    it('emits an INFO log record with default attributes', async () => {
      const logger = getLogger('unit-test-service')
      logger.info('Hello from test', { foo: 'bar' })
      await provider.forceFlush()

      const records = exporter.getFinishedLogRecords()
      expect(records).toHaveLength(1)
      const record = records.find((r) => r.body === 'Hello from test')

      expect(record).toBeDefined()
      expect(record?.severityText).toBe('INFO')
      expect(record?.attributes?.foo).toBe('bar')
      expect(record?.attributes?.['component.name']).toBe('unit-test-service')
    })
    it('records an error message when given an Error object', async () => {
      const logger = getLogger('error-service')
      logger.error(new Error('Something went wrong'))
      await provider.forceFlush()

      const records = exporter.getFinishedLogRecords()

      const errorRecord = records.find((r) => r.severityText === 'ERROR')
      expect(errorRecord).toBeDefined()
      expect(errorRecord?.body).toContain('Something went wrong')
    })
    it('records an error message with error attached', async () => {
      const logger = getLogger('error-service')
      logger.error(new Error('Something went wrong'), new Error('new error'))
      await provider.forceFlush()

      const records = exporter.getFinishedLogRecords()

      const errorRecord = records.find((r) => r.severityText === 'ERROR')
      expect(errorRecord).toBeDefined()
      expect(errorRecord?.body).toContain(
        'Error: Something went wrong: Error: new error'
      )
    })
    it('includes trace and span ids if available', async () => {
      const tracer = trace.getTracer('test')
      const span = tracer.startSpan('test-span')

      context.with(trace.setSpan(context.active(), span), () => {
        const logger = getLogger()
        logger.info('inside-span')
      })

      span.end()
      await provider.forceFlush()
      await wait(50)

      const record = exporter
        .getFinishedLogRecords()
        .find((r) => r.body === 'inside-span')

      expect(record?.attributes?.trace_id).toBeDefined()
      expect(record?.attributes?.span_id).toBeDefined()
    })
  })
})
