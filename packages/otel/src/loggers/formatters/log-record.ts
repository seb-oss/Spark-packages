import type { ReadableLogRecord } from '@opentelemetry/sdk-logs'
import {
  formatAttributes,
  formatLevel,
  formatMessage,
  formatScope,
  formatService,
  formatTimestamp,
} from './shared.js'

export function formatLogRecord(record: ReadableLogRecord): string {
  const timestamp = formatTimestamp(record.hrTime)
  const service = formatService(record.resource)
  const level = formatLevel(record)
  const scope = formatScope(record.resource, record.instrumentationScope)
  const message = formatMessage(record)
  const attrs = formatAttributes(record.attributes)

  return `${service} ${timestamp}  ${level}  ${scope}${message}${attrs}`
}
