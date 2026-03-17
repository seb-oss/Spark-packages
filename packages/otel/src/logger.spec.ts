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
import { getLogger, initialize } from './index'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('getLogger', () => {
  it('does not throw if OTEL is not yet initialized at initialization', () => {
    process.env.NODE_ENV = 'not test'
    expect(() => getLogger()).not.toThrow()
    process.env.NODE_ENV = 'test'
  })
  it('warns if OTEL is not yet initialized at first log call', () => {
    process.env.NODE_ENV = 'not test'
    const warn = vi.spyOn(console, 'warn')
    const log = vi.spyOn(console, 'log')

    expect(() => getLogger().info('hello')).not.toThrow()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('OTEL must be initialized')
    )
    expect(log).toHaveBeenCalledWith('[INFO] hello')

    warn.mockRestore()
    log.mockRestore()
    process.env.NODE_ENV = 'test'
  })
  it('does not warn if NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test'
    const warn = vi.spyOn(console, 'warn')
    const log = vi.spyOn(console, 'log')
    const info = vi.spyOn(console, 'info')

    expect(() => getLogger().info('hello')).not.toThrow()

    expect(warn).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
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
    it('emits a WARN severity record for warn()', async () => {
      const logger = getLogger('warn-service')
      logger.warn('Something might be wrong')
      await provider.forceFlush()

      const records = exporter.getFinishedLogRecords()
      const warnRecord = records.find(
        (r) => r.body === 'Something might be wrong'
      )

      expect(warnRecord).toBeDefined()
      expect(warnRecord?.severityText).toBe('WARN')
      expect(warnRecord?.severityNumber).toBe(13)
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
    it('info accepts (string, Error) signature', async () => {
      const logger = getLogger('test-service')
      const err = new Error('something broke')
      logger.info('context message', err)
      await provider.forceFlush()

      const records = exporter.getFinishedLogRecords()
      const record = records.find((r) => r.severityText === 'INFO')
      expect(record).toBeDefined()
      expect(record?.body).toContain('context message')
      expect(record?.body).toContain('something broke')
    })
    it('warn accepts (string, Error, attrs) signature', async () => {
      const logger = getLogger('test-service')
      const err = new Error('disk full')
      logger.warn('storage issue', err, { disk: '/dev/sda1' })
      await provider.forceFlush()

      const records = exporter.getFinishedLogRecords()
      const record = records.find((r) => r.severityText === 'WARN')
      expect(record).toBeDefined()
      expect(record?.body).toContain('storage issue')
      expect(record?.body).toContain('disk full')
      expect(record?.attributes?.disk).toBe('/dev/sda1')
    })
    it('debug accepts (Error) signature', async () => {
      const logger = getLogger('test-service')
      const err = new Error('debug trace')
      logger.debug(err)
      await provider.forceFlush()

      const records = exporter.getFinishedLogRecords()
      const record = records.find((r) => r.severityText === 'DEBUG')
      expect(record).toBeDefined()
      expect(record?.body).toContain('debug trace')
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
