import type {
  ReadableSpan,
  SpanExporter,
  SpanProcessor,
} from '@opentelemetry/sdk-trace-node'

export class TreeSpanProcessor implements SpanProcessor {
  private exporter: SpanExporter
  private orphans: Map<string, ReadableSpan[]> = new Map()

  constructor(exporter: SpanExporter) {
    this.exporter = exporter
  }

  onStart(): void {
    // no-op
  }

  onEnd(span: ReadableSpan): void {
    const parentId = span.parentSpanContext?.spanId

    if (parentId) {
      const siblings = this.orphans.get(parentId) || []
      this.orphans.set(parentId, [...siblings, span])

      return
    }

    const children = this.getChildrenRecursively(span)
    const sorted = [span, ...children].sort((s1, s2) => {
      const [sec1, nano1] = s1.startTime
      const [sec2, nano2] = s2.startTime

      if (sec1 !== sec2) return sec1 - sec2
      return nano1 - nano2
    })
    this.exporter.export(sorted, () => {})
  }

  private getChildrenRecursively(span: ReadableSpan) {
    const spanId = span.spanContext().spanId
    const children = this.orphans.get(spanId) || []
    this.orphans.delete(spanId)

    const result = [...children]
    for (const child of children) {
      result.push(...this.getChildrenRecursively(child))
    }

    return result
  }

  shutdown(): Promise<void> {
    return this.exporter.shutdown()
  }

  async forceFlush(): Promise<void> {
    await this.exporter.forceFlush?.()
  }
}
