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
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getLogger } from './logger'
import { initialize } from './otel'

// --- Extended in-memory exporter to inspect emitted logs ---
class InMemoryLogRecordExporterExt extends InMemoryLogRecordExporter {
  getRecords(): LogRecord[] {
    // @ts-expect-error internal field from base class
    return this._finishedLogRecords ?? []
  }

  reset(): void {
    // @ts-expect-error internal field from base class
    this._finishedLogRecords = []
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('getLogger', () => {
  let exporter: InMemoryLogRecordExporterExt
  let provider: LoggerProvider

  beforeEach(async () => {
    // Initialize OpenTelemetry first (will skip log provider setup in test mode)
    await initialize()

    // Create fresh exporter and provider for each test
    exporter = new InMemoryLogRecordExporterExt()
    provider = new LoggerProvider({
      resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'test-service' }),
      processors: [new SimpleLogRecordProcessor(exporter)],
    })
  })

  afterEach(async () => {
    // Clean up after each test
    if (provider) {
      await provider.shutdown()
    }
  })

  it('emits an INFO log record with default attributes', async () => {
    const logger = getLogger(
      'test-service',
      { 'test.custom': 'value' },
      provider
    )

    logger.info('Hello from test', { message: 'custom' })

    const records = exporter.getRecords()
    expect(records.length).toBeGreaterThan(0)
    const record = records.find((r) => r.body === 'Hello from test')
    expect(record).toBeDefined()
    expect(record?.severityText).toBe('INFO')
    expect(record?.severityNumber).toBe(9)
    expect(record?.attributes?.['component.name']).toBe('test-service')
    expect(record?.attributes?.['test.custom']).toBe('value')
    expect(record?.attributes?.message).toBe('custom')
  })
  it('records an error message when given an Error object', async () => {
    const logger = getLogger('error-service', {}, provider)
    logger.error(new Error('Something went wrong'))

    await wait(100)
    const records = exporter.getRecords()

    const errorRecord = records.find((r) => r.severityText === 'ERROR')
    expect(errorRecord).toBeDefined()
    expect(errorRecord?.body).toContain('Something went wrong')
  })
  it('records an error message with error attached', async () => {
    const logger = getLogger('error-service', {}, provider)
    logger.error(new Error('Something went wrong'), new Error('new error'))

    await wait(100)
    const records = exporter.getRecords()

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
      const logger = getLogger(undefined, {}, provider)
      logger.info('inside-span')
    })

    span.end()

    await new Promise((r) => setTimeout(r, 50))

    const record = exporter.getRecords().find((r) => r.body === 'inside-span')

    expect(record?.attributes?.trace_id).toBeDefined()
    expect(record?.attributes?.span_id).toBeDefined()
  })
})
