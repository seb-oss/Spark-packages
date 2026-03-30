import type { ReadableSpan } from '@opentelemetry/sdk-trace-node'
import { describe, expect, it, vi } from 'vitest'
import { TreeSpanProcessor } from './tree-span-processor'

const makeExporter = () => {
  const exported: ReadableSpan[][] = []
  return {
    exporter: {
      export: vi.fn(
        (spans: ReadableSpan[], cb: (result: { code: number }) => void) => {
          exported.push(spans)
          cb({ code: 0 })
        }
      ),
      shutdown: vi.fn().mockResolvedValue(undefined),
      forceFlush: vi.fn().mockResolvedValue(undefined),
    },
    exported,
  }
}

const makeSpan = (id: string, parentId?: string): ReadableSpan =>
  ({
    spanContext: () => ({ spanId: id, traceId: 'trace', traceFlags: 1 }),
    parentSpanContext: parentId
      ? { spanId: parentId, traceId: 'trace', traceFlags: 1 }
      : undefined,
    startTime: [0, id.charCodeAt(0) * 1_000_000],
    endTime: [0, id.charCodeAt(0) * 1_000_000 + 1],
    name: id,
    status: { code: 0 },
    attributes: {},
    links: [],
    events: [],
    duration: [0, 1],
    kind: 0,
    resource: { attributes: {} } as any,
    instrumentationScope: { name: 'test' },
    droppedAttributesCount: 0,
    droppedEventsCount: 0,
    droppedLinksCount: 0,
  }) as unknown as ReadableSpan

describe('TreeSpanProcessor', () => {
  it('calls exporter.shutdown() on shutdown()', async () => {
    const { exporter } = makeExporter()
    const processor = new TreeSpanProcessor(exporter)
    await processor.shutdown()
    expect(exporter.shutdown).toHaveBeenCalledOnce()
  })

  it('calls exporter.forceFlush() on forceFlush()', async () => {
    const { exporter } = makeExporter()
    const processor = new TreeSpanProcessor(exporter)
    await processor.forceFlush()
    expect(exporter.forceFlush).toHaveBeenCalledOnce()
  })

  it('forceFlush resolves even when exporter has no forceFlush', async () => {
    const exporter = {
      export: vi.fn(),
      shutdown: vi.fn().mockResolvedValue(undefined),
    }
    const processor = new TreeSpanProcessor(exporter as any)
    await expect(processor.forceFlush()).resolves.toBeUndefined()
  })

  it('exports root span immediately (no parent)', () => {
    const { exporter, exported } = makeExporter()
    const processor = new TreeSpanProcessor(exporter)
    const root = makeSpan('a')
    processor.onEnd(root)
    expect(exported).toHaveLength(1)
    expect(exported[0]).toContainEqual(root)
  })

  it('buffers child spans until their root is ended', () => {
    const { exporter, exported } = makeExporter()
    const processor = new TreeSpanProcessor(exporter)

    const root = makeSpan('a')
    const child = makeSpan('b', 'a')

    processor.onEnd(child)
    expect(exported).toHaveLength(0)

    processor.onEnd(root)
    expect(exported).toHaveLength(1)
    expect(exported[0]).toContainEqual(root)
    expect(exported[0]).toContainEqual(child)
  })

  it('collects nested descendants recursively', () => {
    const { exporter, exported } = makeExporter()
    const processor = new TreeSpanProcessor(exporter)

    const root = makeSpan('a')
    const child = makeSpan('b', 'a')
    const grandchild = makeSpan('c', 'b')

    processor.onEnd(grandchild)
    processor.onEnd(child)
    processor.onEnd(root)

    expect(exported).toHaveLength(1)
    const batch = exported[0]
    expect(batch).toContainEqual(root)
    expect(batch).toContainEqual(child)
    expect(batch).toContainEqual(grandchild)
  })

  it('sorts exported spans by startTime ascending', () => {
    const { exporter, exported } = makeExporter()
    const processor = new TreeSpanProcessor(exporter)

    const root = makeSpan('a')
    const child = makeSpan('c', 'a')
    const siblingChild = makeSpan('b', 'a')

    processor.onEnd(child)
    processor.onEnd(siblingChild)
    processor.onEnd(root)

    const batch = exported[0]
    const names = batch.map((s) => s.name)
    expect(names[0]).toBe('a')
    expect(names[1]).toBe('b')
    expect(names[2]).toBe('c')
  })

  it('accumulates multiple children for the same parent before root ends', () => {
    const { exporter, exported } = makeExporter()
    const processor = new TreeSpanProcessor(exporter)
    const root = makeSpan('a')
    const child1 = makeSpan('b', 'a')
    const child2 = makeSpan('c', 'a')
    processor.onEnd(child1)
    processor.onEnd(child2)
    processor.onEnd(root)
    expect(exported[0]).toContainEqual(child1)
    expect(exported[0]).toContainEqual(child2)
  })

  it('onStart is a no-op', () => {
    const { exporter } = makeExporter()
    const processor = new TreeSpanProcessor(exporter)
    expect(() => processor.onStart()).not.toThrow()
  })
})
