import { SpanStatusCode } from '@opentelemetry/api'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-node'
import {
  calculateDuration,
  formatService,
  formatTimestamp,
  hrTimeToMillis,
} from './shared'
import { colors, statusColorMap, statusLabelMap } from './style'

const LABEL_WIDTH = 20
const DESCRIPTION_MAX_WIDTH = 16
const BAR_MIN_WIDTH = 1
const BAR_MAX_WIDTH = 20

export function formatSpans(spans: ReadableSpan[]) {
  const rootSpan = spans[0]
  const rootStart = hrTimeToMillis(rootSpan.startTime)
  const rootEnd = hrTimeToMillis(rootSpan.endTime)
  const totalDuration = rootEnd - rootStart

  const service = formatService(rootSpan.resource)
  const timestamp = formatTimestamp(rootSpan.startTime)
  const traceId = colors.gray(`[${rootSpan.spanContext().traceId}]`)

  const lines = [`${service} ${timestamp} ${traceId}`]

  for (const span of spans) {
    const offset = hrTimeToMillis(span.startTime) - rootStart
    const depth = computeDepth(span, spans) // optional
    lines.push(
      formatSpan(span, {
        offsetMs: offset,
        totalDurationMs: totalDuration,
        depth,
      })
    )
  }

  return lines.join('\n')
}

export function formatSpan(
  span: ReadableSpan,
  opts: {
    offsetMs: number // relative start time in ms (0 for root)
    totalDurationMs: number // total duration in ms (root span duration)
    depth: number // nesting level for indent
  }
): string {
  const label = formatLabel(span, opts.depth)
  const bar = buildBar(span, opts?.offsetMs, opts?.totalDurationMs)
  const barColor =
    span.status.code === SpanStatusCode.OK
      ? colors.green
      : span.status.code === SpanStatusCode.ERROR
        ? colors.red
        : colors.gray
  const desc = formatDescription(span)
  const status = formatStatus(span)
  const duration = formatDuration(span, opts?.offsetMs)
  const spanId = colors.gray(`[${span.spanContext().spanId}]`)

  return `${label} ${barColor(bar)} ${desc} ${status} ${duration} ${spanId}`
}

function formatLabel(span: ReadableSpan, depth: number) {
  const indent = '  '.repeat(depth) // 2 spaces per depth level
  const label = `${indent}└─ ${span.name}`
  return label.padEnd(LABEL_WIDTH)
}

function buildBar(
  span: ReadableSpan,
  offsetMs: number | undefined,
  totalDurationMs: number | undefined
) {
  const duration = calculateDuration(span)

  if (
    typeof offsetMs !== 'number' ||
    typeof totalDurationMs !== 'number' ||
    totalDurationMs === 0
  ) {
    // fallback: show duration-only bar
    const capped = Math.min(duration, 1000)
    const barLength = Math.max(
      BAR_MIN_WIDTH,
      Math.round((capped / 1000) * BAR_MAX_WIDTH)
    )
    return '█'.repeat(barLength).padEnd(BAR_MAX_WIDTH + 2)
  }

  // Relative position and size
  const offsetRatio = Math.max(0, Math.min(offsetMs / totalDurationMs, 1))
  const durationRatio = Math.max(0, Math.min(duration / totalDurationMs, 1))

  const offsetChars = Math.floor(offsetRatio * BAR_MAX_WIDTH)
  const barChars = Math.max(
    BAR_MIN_WIDTH,
    Math.round(durationRatio * BAR_MAX_WIDTH)
  )

  const empty = ' '.repeat(offsetChars)
  const bar = '█'.repeat(barChars)

  return (empty + bar).padEnd(BAR_MAX_WIDTH + 2)
}

function formatDescription(span: ReadableSpan): string {
  const keyPriority = [
    // HTTP
    ['http.method', 'http.target'], // → GET /users/123
    ['http.route'], // → /users/:id
    ['http.url'], // → https://...

    // GraphQL
    ['graphql.operation.name'], // → getUsers
    ['graphql.operation.type'], // → query
    ['graphql.document'], // → full query text (maybe too long)

    // WebSocket
    ['ws.event'], // → connection, message, disconnect
    ['ws.message_type'], // → ping/pong/text/binary
    ['ws.url'], // → wss://...

    // Redis
    ['db.system', 'db.statement'], // → redis, "SET foo bar"
    ['db.operation'], // → GET, SET

    // Spanner
    ['db.statement'], // → SELECT * FROM...
    ['db.operation'], // → SELECT, INSERT
    ['db.name'], // → projects/.../instances/.../databases/...

    // OpenSearch
    ['db.operation'], // → search, index, bulk
    ['db.statement'], // → { query DSL... }

    // Pub/Sub (GCP)
    ['messaging.operation'], // → publish, receive
    ['messaging.destination'], // → topic-a
    ['messaging.gcp_pubsub.topic'], // → projects/x/topics/y

    // General FaaS
    ['faas.invoked_name'], // → myFunction
    ['faas.trigger'], // → http, pubsub, etc.

    // Custom or fallback
    ['otel.description'],
  ]

  for (const keys of keyPriority) {
    const parts = keys
      .map((k) => span.attributes[k])
      .filter((v) => v !== undefined && v !== null)
      .map((v) => String(v)) // 👈 FIX — guarantees string
    if (parts.length > 0) {
      return truncate(parts.join(' '), DESCRIPTION_MAX_WIDTH - 1).padEnd(
        DESCRIPTION_MAX_WIDTH
      )
    }
  }

  return ''.padEnd(DESCRIPTION_MAX_WIDTH)
}

function formatStatus(span: ReadableSpan): string {
  const code = span.status.code
  const label = statusLabelMap[code] ?? 'UNSET'
  const colorFn = statusColorMap[code] ?? colors.gray
  return colorFn(label).padEnd(6)
}

function formatDuration(
  span: ReadableSpan,
  offsetMs: number | undefined
): string {
  const duration = calculateDuration(span)

  const format = (ms: number): string =>
    ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`

  return `(${format(offsetMs || 0)}–${format(duration)})`.padEnd(16)
}

function truncate(input: unknown, maxLength: number): string {
  // In practice, input is always a string — the String() cast is a defensive fallback.
  const str = String(input)
  return str.length > maxLength ? `${str.slice(0, maxLength - 1)}…` : str
}

function computeDepth(span: ReadableSpan, allSpans: ReadableSpan[]): number {
  let depth = 0
  let currentParentId = span.parentSpanContext?.spanId

  while (currentParentId) {
    const parentSpan = allSpans.find(
      (s) => s.spanContext().spanId === currentParentId
    )
    if (!parentSpan) break

    depth += 1
    currentParentId = parentSpan.parentSpanContext?.spanId
  }

  return depth
}
