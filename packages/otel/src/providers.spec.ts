import {
  BatchLogRecordProcessor,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import {
  BatchSpanProcessor,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TreeSpanProcessor } from './loggers/tree-span-processor'
import {
  getLogRecordProcessors,
  getMetricReader,
  getSpanProcessor,
} from './providers'

describe('getLogRecordProcessors', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('returns a console processor without OTLP endpoint', () => {
    const processors = getLogRecordProcessors(undefined)
    expect(processors).toHaveLength(1)
    expect(processors[0]).toBeInstanceOf(SimpleLogRecordProcessor)
  })

  it('returns a batch processor with OTLP endpoint', () => {
    delete process.env.LOG_LEVEL
    const processors = getLogRecordProcessors('http://collector:4317')
    expect(processors).toHaveLength(1)
    expect(processors[0]).toBeInstanceOf(BatchLogRecordProcessor)
  })

  it('adds console processor when OTLP endpoint and LOG_LEVEL are set', () => {
    process.env.LOG_LEVEL = 'INFO'
    const processors = getLogRecordProcessors('http://collector:4317')
    expect(processors).toHaveLength(2)
    expect(processors[0]).toBeInstanceOf(BatchLogRecordProcessor)
    expect(processors[1]).toBeInstanceOf(SimpleLogRecordProcessor)
  })
})

describe('getSpanProcessor', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('returns a TreeSpanProcessor without OTLP endpoint', () => {
    const processor = getSpanProcessor(undefined)
    expect(processor).toBeInstanceOf(TreeSpanProcessor)
  })

  it('returns a BatchSpanProcessor with OTLP endpoint', () => {
    const processor = getSpanProcessor('http://collector:4317')
    expect(processor).toBeInstanceOf(BatchSpanProcessor)
  })

  it('returns a SimpleSpanProcessor with OTLP endpoint when OTEL_SIMPLE_SPAN_PROCESSOR=true', () => {
    process.env.OTEL_SIMPLE_SPAN_PROCESSOR = 'true'
    const processor = getSpanProcessor('http://collector:4317')
    expect(processor).toBeInstanceOf(SimpleSpanProcessor)
  })

  it('returns a BatchSpanProcessor when OTEL_SIMPLE_SPAN_PROCESSOR is not true', () => {
    process.env.OTEL_SIMPLE_SPAN_PROCESSOR = 'false'
    const processor = getSpanProcessor('http://collector:4317')
    expect(processor).toBeInstanceOf(BatchSpanProcessor)
  })

  it('ignores OTEL_SIMPLE_SPAN_PROCESSOR without OTLP endpoint', () => {
    process.env.OTEL_SIMPLE_SPAN_PROCESSOR = 'true'
    const processor = getSpanProcessor(undefined)
    expect(processor).toBeInstanceOf(TreeSpanProcessor)
  })
})

describe('getMetricReader', () => {
  it('returns a PeriodicExportingMetricReader without OTLP endpoint', () => {
    const reader = getMetricReader(undefined)
    expect(reader).toBeInstanceOf(PeriodicExportingMetricReader)
  })

  it('returns a PeriodicExportingMetricReader with OTLP endpoint', () => {
    const reader = getMetricReader('http://collector:4317')
    expect(reader).toBeInstanceOf(PeriodicExportingMetricReader)
  })
})
