import { SpanStatusCode } from '@opentelemetry/api'
import { Resource } from '@opentelemetry/resources'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-node'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsoleSpanPrettyExporter } from './console-span-pretty-exporter'

describe('ConsoleSpanPrettyExporter', () => {
  const createSpan = (name: string, status: SpanStatusCode): ReadableSpan =>
    ({
      name,
      status: { code: status },
      startTime: [0, 0],
      endTime: [1, 0],
      duration: [1, 0],
      spanContext: () => ({ traceId: 'abc', spanId: name, traceFlags: 1 }),
      parentSpanContext: undefined,
      kind: 0,
      resource: {
        attributes: {
          'service.name': 'test',
          'service.version': '1.0.0',
        },
      } as Partial<Resource> as Resource,
      instrumentationScope: { name: 'test', version: '1.0.0' },
      attributes: {},
      links: [],
      events: [],
    }) as Partial<ReadableSpan> as ReadableSpan

  let consoleLog: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => {
    consoleLog.mockRestore()
    delete process.env.SPAN_LEVEL
  })
  it('logs all spans if no SPAN_LEVEL is set', () => {
    const exporter = new ConsoleSpanPrettyExporter()
    const spans = [
      createSpan('span-ok', SpanStatusCode.OK),
      createSpan('span-error', SpanStatusCode.ERROR),
      createSpan('span-unset', SpanStatusCode.UNSET),
    ]

    exporter.export(spans, () => {})

    expect(consoleLog).toHaveBeenCalledTimes(1)
    const output = consoleLog.mock.calls[0][0]
    expect(output).toContain('span-ok')
    expect(output).toContain('span-error')
    expect(output).toContain('span-unset')
  })
  it('prints the entire tree if any span matches SPAN_LEVEL', () => {
    process.env.SPAN_LEVEL = 'ERROR'
    const exporter = new ConsoleSpanPrettyExporter()
    const spans = [
      createSpan('span-ok', SpanStatusCode.OK),
      createSpan('span-error', SpanStatusCode.ERROR),
    ]

    exporter.export(spans, () => {})

    expect(consoleLog).toHaveBeenCalledTimes(1)
    const output = consoleLog.mock.calls[0][0]
    expect(output).toContain('span-ok') // should be included
    expect(output).toContain('span-error') // matched SPAN_LEVEL
  })
  it('does not print tree if no span matches SPAN_LEVEL', () => {
    process.env.SPAN_LEVEL = 'ERROR'
    const exporter = new ConsoleSpanPrettyExporter()
    const spans = [
      createSpan('span-unset', SpanStatusCode.UNSET),
      createSpan('span-ok', SpanStatusCode.OK),
    ]

    exporter.export(spans, () => {})

    expect(consoleLog).not.toHaveBeenCalled()
  })
  it('handles multiple statuses in SPAN_LEVEL', () => {
    process.env.SPAN_LEVEL = 'OK,ERROR'
    const exporter = new ConsoleSpanPrettyExporter()
    const spans = [
      createSpan('span-ok', SpanStatusCode.OK),
      createSpan('span-unset', SpanStatusCode.UNSET),
    ]

    exporter.export(spans, () => {})

    expect(consoleLog).toHaveBeenCalledTimes(1)
    const output = consoleLog.mock.calls[0][0]
    expect(output).toContain('span-ok')
    expect(output).toContain('span-unset') // included because span-ok matched
  })
  it('is case-insensitive for SPAN_LEVEL values', () => {
    process.env.SPAN_LEVEL = 'error'
    const exporter = new ConsoleSpanPrettyExporter()
    const spans = [createSpan('span-error', SpanStatusCode.ERROR)]

    exporter.export(spans, () => {})

    expect(consoleLog).toHaveBeenCalledTimes(1)
    expect(consoleLog.mock.calls[0][0]).toContain('span-error')
  })
  it('ignores invalid SPAN_LEVEL entries gracefully', () => {
    process.env.SPAN_LEVEL = 'FOO,BAR,ERROR'
    const exporter = new ConsoleSpanPrettyExporter()
    const spans = [
      createSpan('span-ok', SpanStatusCode.OK),
      createSpan('span-error', SpanStatusCode.ERROR),
    ]

    exporter.export(spans, () => {})

    expect(consoleLog).toHaveBeenCalledTimes(1)
    const output = consoleLog.mock.calls[0][0]
    expect(output).toContain('span-error')
    expect(output).toContain('span-ok') // still included since error matched
  })
})
