import { SpanStatusCode } from '@opentelemetry/api'
import { type ExportResult, ExportResultCode } from '@opentelemetry/core'
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-node'
import { formatSpans } from './formatters/index.js'

export class ConsoleSpanPrettyExporter implements SpanExporter {
  private readonly allowedStatuses: Set<number>

  constructor() {
    const env = process.env.SPAN_LEVEL?.toUpperCase()
    if (!env) {
      this.allowedStatuses = new Set([
        SpanStatusCode.UNSET,
        SpanStatusCode.OK,
        SpanStatusCode.ERROR,
      ])
    } else {
      const map: Record<string, number> = {
        UNSET: SpanStatusCode.UNSET,
        OK: SpanStatusCode.OK,
        ERROR: SpanStatusCode.ERROR,
      }

      this.allowedStatuses = new Set(
        env
          .split(',')
          .map((s) => s.trim())
          .map((s) => map[s])
          .filter((v): v is number => typeof v === 'number')
      )
    }
  }

  private shouldExport(spans: ReadableSpan[]) {
    // print all spans
    if (this.allowedStatuses.size === 3) {
      return true
    }
    // print only certain levels
    return spans.some((span) => this.allowedStatuses.has(span.status.code))
  }

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    if (this.shouldExport(spans)) {
      console.log(formatSpans(spans))
    }

    resultCallback({ code: ExportResultCode.SUCCESS })
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }
}
