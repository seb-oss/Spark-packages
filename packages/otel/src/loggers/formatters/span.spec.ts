import { SpanStatusCode } from '@opentelemetry/api'
import { Resource } from '@opentelemetry/resources'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-node'
import { describe, expect, it } from 'vitest'
import { formatSpans } from './index'

const makeResource = () =>
  ({
    attributes: {
      'service.name': 'test-service',
      'service.version': '1.0.0',
    },
  }) as Partial<Resource> as Resource

const makeSpan = (
  id: string,
  overrides: Partial<ReadableSpan> = {}
): ReadableSpan =>
  ({
    name: id,
    status: { code: SpanStatusCode.OK },
    startTime: [0, 0],
    endTime: [1, 0],
    duration: [1, 0],
    spanContext: () => ({ spanId: id, traceId: 'trace-abc', traceFlags: 1 }),
    parentSpanContext: undefined,
    kind: 0,
    resource: makeResource(),
    instrumentationScope: { name: 'test', version: '1.0.0' },
    attributes: {},
    links: [],
    events: [],
    droppedAttributesCount: 0,
    droppedEventsCount: 0,
    droppedLinksCount: 0,
    ...overrides,
  }) as Partial<ReadableSpan> as ReadableSpan

describe('formatSpans', () => {
  it('formats a single root span without error', () => {
    const span = makeSpan('root')
    const result = formatSpans([span])
    expect(result).toContain('trace-abc')
    expect(result).toContain('root')
  })

  it('truncates long attribute values in description', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(100)
    const span = makeSpan('root', {
      attributes: { 'http.url': longUrl },
    })
    const result = formatSpans([span])
    expect(result).toContain('…')
    expect(result).not.toContain(longUrl)
  })

  it('handles span with parentSpanContext not found in spans array (break path)', () => {
    const child = makeSpan('child', {
      parentSpanContext: {
        spanId: 'nonexistent-parent',
        traceId: 'trace-abc',
        traceFlags: 1,
      },
    })
    expect(() => formatSpans([child])).not.toThrow()
    const result = formatSpans([child])
    expect(result).toContain('child')
  })

  it('computes depth for nested spans', () => {
    const root = makeSpan('root')
    const child = makeSpan('child', {
      parentSpanContext: {
        spanId: 'root',
        traceId: 'trace-abc',
        traceFlags: 1,
      },
    })
    const result = formatSpans([root, child])
    expect(result).toContain('root')
    expect(result).toContain('child')
  })

  it('formats spans with ERROR status', () => {
    const span = makeSpan('root', {
      status: { code: SpanStatusCode.ERROR },
    })
    const result = formatSpans([span])
    expect(result).toContain('root')
  })

  it('formats spans with UNSET status', () => {
    const span = makeSpan('root', {
      status: { code: SpanStatusCode.UNSET },
    })
    const result = formatSpans([span])
    expect(result).toContain('root')
  })
})
