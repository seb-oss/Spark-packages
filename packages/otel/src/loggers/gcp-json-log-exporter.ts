import { type ExportResult, ExportResultCode } from '@opentelemetry/core'
import type {
  LogRecordExporter,
  ReadableLogRecord,
} from '@opentelemetry/sdk-logs'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import { LOG_SEVERITY_MAP, type LOG_SEVERITY_NAME } from '../consts'
import { hrTimeToMillis } from './formatters/shared'

/**
 * GCP Cloud Logging severity levels.
 * Maps OTEL severity numbers to GCP-recognized severity strings.
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
 */
const OTEL_TO_GCP_SEVERITY: Record<string, string> = {
  TRACE: 'DEBUG',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  NOTICE: 'NOTICE',
  WARNING: 'WARNING',
  WARN: 'WARNING',
  ERROR: 'ERROR',
  FATAL: 'CRITICAL',
  CRITICAL: 'CRITICAL',
  ALERT: 'ALERT',
  EMERGENCY: 'EMERGENCY',
}

/** Attribute keys that are excluded from labels (already represented elsewhere in the JSON) */
const EXCLUDED_LABEL_KEYS = new Set([
  'service.name',
  'service.version',
  'serviceContext.service',
  'serviceContext.version',
  'component.name',
  'cloud.orchestrator',
  'trace_id',
  'span_id',
  'gcp.log_name',
])

/**
 * A LogRecordExporter that outputs structured JSON to stdout,
 * compatible with GCP Cloud Logging's expected format.
 *
 * When running on GKE, Cloud Logging automatically picks up
 * JSON lines from stdout and parses recognized fields like
 * `severity`, `message`, `logging.googleapis.com/trace`, etc.
 *
 * @see https://cloud.google.com/logging/docs/structured-logging
 */
export class GcpJsonLogExporter implements LogRecordExporter {
  private readonly logThreshold: number
  private readonly gcpProject: string | undefined

  constructor() {
    const defaultLogLevel = 'INFO'
    const env = (process.env.LOG_LEVEL?.toUpperCase() ??
      defaultLogLevel) as LOG_SEVERITY_NAME
    this.logThreshold =
      LOG_SEVERITY_MAP[env] ?? LOG_SEVERITY_MAP[defaultLogLevel]
    this.gcpProject =
      process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
  }

  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void
  ): void {
    for (const record of logs) {
      if ((record.severityNumber ?? 0) >= this.logThreshold) {
        const json = this.formatRecord(record)
        process.stdout.write(`${json}\n`)
      }
    }

    resultCallback({ code: ExportResultCode.SUCCESS })
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }

  private formatRecord(record: ReadableLogRecord): string {
    const severityText = (record.severityText ?? 'INFO').toUpperCase()
    const severity = OTEL_TO_GCP_SEVERITY[severityText] ?? 'DEFAULT'
    const timestamp = new Date(hrTimeToMillis(record.hrTime)).toISOString()
    const message =
      typeof record.body === 'string'
        ? record.body
        : JSON.stringify(record.body)

    const serviceName =
      record.resource.attributes[ATTR_SERVICE_NAME] ?? 'unknown-service'
    const serviceVersion =
      record.resource.attributes[ATTR_SERVICE_VERSION] ?? '1.0.0'

    const traceId = record.attributes.trace_id as string | undefined
    const spanId = record.attributes.span_id as string | undefined

    // Build the structured log entry
    const entry: Record<string, unknown> = {
      severity,
      message,
      time: timestamp,
      serviceContext: {
        service: serviceName,
        version: serviceVersion,
      },
    }

    // GCP trace correlation
    if (traceId) {
      entry['logging.googleapis.com/trace'] = this.gcpProject
        ? `projects/${this.gcpProject}/traces/${traceId}`
        : traceId
    }

    if (spanId) {
      entry['logging.googleapis.com/spanId'] = spanId
    }

    // Collect remaining attributes as labels
    const labels: Record<string, string> = {}
    for (const [key, value] of Object.entries(record.attributes)) {
      if (EXCLUDED_LABEL_KEYS.has(key)) continue
      labels[key] =
        typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
    if (Object.keys(labels).length > 0) {
      entry['logging.googleapis.com/labels'] = labels
    }

    return JSON.stringify(entry)
  }
}
