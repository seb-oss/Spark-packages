import { resourceFromAttributes } from '@opentelemetry/resources'
import { LoggerProvider } from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TreeSpanProcessor } from './loggers/tree-span-processor'
import { getLogProvider, getMetricReader, getSpanProcessor } from './providers'

const resource = resourceFromAttributes({ 'service.name': 'test-service' })

describe('getLogProvider', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('returns a LoggerProvider without OTLP endpoint', () => {
    const provider = getLogProvider(resource, undefined)
    expect(provider).toBeInstanceOf(LoggerProvider)
  })

  it('returns a LoggerProvider with OTLP endpoint', () => {
    const provider = getLogProvider(resource, 'http://collector:4317')
    expect(provider).toBeInstanceOf(LoggerProvider)
  })

  it('adds console exporter when OTLP endpoint and LOG_LEVEL are set', () => {
    process.env.LOG_LEVEL = 'INFO'
    const provider = getLogProvider(resource, 'http://collector:4317')
    expect(provider).toBeInstanceOf(LoggerProvider)
  })
})

describe('getSpanProcessor', () => {
  it('returns a TreeSpanProcessor without OTLP endpoint', () => {
    const processor = getSpanProcessor(undefined)
    expect(processor).toBeInstanceOf(TreeSpanProcessor)
  })

  it('returns a BatchSpanProcessor with OTLP endpoint', () => {
    const processor = getSpanProcessor('http://collector:4317')
    expect(processor).toBeInstanceOf(BatchSpanProcessor)
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
