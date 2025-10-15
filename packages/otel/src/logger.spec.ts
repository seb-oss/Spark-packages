import { context, trace } from '@opentelemetry/api'
import { LogRecord, logs } from '@opentelemetry/api-logs'
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  InMemoryLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { beforeEach, describe, expect, it } from 'vitest'
import { getLogger } from './logger'
import { initialize } from './otel'

// --- Extended in-memory exporter to inspect emitted logs ---
class InMemoryLogRecordExporterExt extends InMemoryLogRecordExporter {
  getRecords(): LogRecord[] {
    // @ts-expect-error internal field from base class
    return this._finishedLogRecords ?? []
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('getLogger', () => {
  const exporter = new InMemoryLogRecordExporterExt()
  const provider = new LoggerProvider({
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'test-service' }),
    processors: [new SimpleLogRecordProcessor(exporter)],
  })
  beforeEach(() => {
    exporter.reset()
    logs.setGlobalLoggerProvider(provider)
  })
  it('emits an INFO log record with default attributes', async () => {
    const logger = getLogger('unit-test-service')
    logger.info('Hello from test', { foo: 'bar' })

    await wait(100)

    const records = exporter.getRecords()
    expect(records.length).toBeGreaterThan(0)
    const record = records.find((r) => r.body === 'Hello from test')

    expect(record).toBeDefined()
    expect(record?.severityText).toBe('INFO')
    expect(record?.attributes?.foo).toBe('bar')
    expect(record?.attributes?.['component.name']).toBe('unit-test-service')
  })
  it('records an error message when given an Error object', async () => {
    const logger = getLogger('error-service')
    logger.error(new Error('Something went wrong'))

    await wait(100)
    const records = exporter.getRecords()

    const errorRecord = records.find((r) => r.severityText === 'ERROR')
    expect(errorRecord).toBeDefined()
    expect(errorRecord?.body).toContain('Something went wrong')
  })
  it('records an error message with error attached', async () => {
    const logger = getLogger('error-service')
    logger.error(new Error('Something went wrong'), new Error('new error'))

    await wait(100)
    const records = exporter.getRecords()

    const errorRecord = records.find((r) => r.severityText === 'ERROR')
    expect(errorRecord).toBeDefined()
    expect(errorRecord?.body).toContain('Error: Something went wrong: Error: new error')
  })
  it('includes trace and span ids if available', async () => {
    await initialize()

    const tracer = trace.getTracer('test')
    const span = tracer.startSpan('test-span')

    context.with(trace.setSpan(context.active(), span), () => {
      const logger = getLogger()
      logger.info('inside-span')
    })

    span.end()

    await new Promise((r) => setTimeout(r, 50))

    const record = exporter.getRecords().find((r) => r.body === 'inside-span')

    expect(record?.attributes?.trace_id).toBeDefined()
    expect(record?.attributes?.span_id).toBeDefined()
  })
})
