import { metrics } from '@opentelemetry/api'
import { MeterProvider } from '@opentelemetry/sdk-metrics'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMeter } from './metrics'
import { initialize } from './otel'

describe('getMeter', () => {
  it('warns if OTEL is not yet initialized', () => {
    const warn = vi.spyOn(console, 'warn')

    expect(() => getMeter()).not.toThrow()
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('OTEL must be initialized')
    )

    warn.mockRestore()
  })
  describe('after initialize()', () => {
    beforeEach(async () => {
      await initialize()

      const provider = new MeterProvider()
      metrics.disable()
      metrics.setGlobalMeterProvider(provider)
    })
    it('returns a meter from OpenTelemetry', async () => {
      const meter = getMeter()

      expect(meter).toBeDefined()
      expect(typeof meter.createCounter).toBe('function')
      expect(typeof meter.createHistogram).toBe('function')
    })
    it('returns different meters for different services', () => {
      const m1 = getMeter('svc-a')
      const m2 = getMeter('svc-b')

      expect(m1).not.toBe(m2)
    })
    it('can create a counter metric', async () => {
      const meter = getMeter('metric-service')

      const counter = meter.createCounter('test_counter', {
        description: 'A test counter',
        unit: '1',
      })

      expect(counter).toBeDefined()
      expect(typeof counter.add).toBe('function')
    })
    it('can create a histogram metric', async () => {
      const meter = getMeter('histogram-service')

      const histogram = meter.createHistogram('test_histogram', {
        description: 'A test histogram',
        unit: 'ms',
      })

      expect(histogram).toBeDefined()
      expect(typeof histogram.record).toBe('function')
    })
  })
})
