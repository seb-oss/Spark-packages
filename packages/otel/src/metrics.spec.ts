import { beforeEach, describe, expect, it } from 'vitest'
import { getMeter } from './metrics'
import { initialize } from './otel'

describe('getMeter', () => {
  beforeEach(async () => {
    // Initialize OpenTelemetry to ensure proper state
    await initialize()
  })
  it('returns a meter from OpenTelemetry', async () => {
    const meter = await getMeter()

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
    const meter = await getMeter('metric-service')

    const counter = meter.createCounter('test_counter', {
      description: 'A test counter',
      unit: '1',
    })

    expect(counter).toBeDefined()
    expect(typeof counter.add).toBe('function')
  })
  it('can create a histogram metric', async () => {
    const meter = await getMeter('histogram-service')

    const histogram = meter.createHistogram('test_histogram', {
      description: 'A test histogram',
      unit: 'ms',
    })

    expect(histogram).toBeDefined()
    expect(typeof histogram.record).toBe('function')
  })
})
