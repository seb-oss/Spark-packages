import { SeverityNumber } from '@opentelemetry/api-logs'
import { type ExportResult, ExportResultCode } from '@opentelemetry/core'
import type {
  LogRecordExporter,
  ReadableLogRecord,
} from '@opentelemetry/sdk-logs'
import { LOG_SEVERITY_MAP, type LOG_SEVERITY_NAME } from '../consts'
import { formatLogRecord } from './formatters'

export class ConsoleLogPrettyExporter implements LogRecordExporter {
  private readonly logThreshold: number
  constructor() {
    const defaultLogLevel = 'INFO'
    const env = (process.env.LOG_LEVEL?.toUpperCase() ??
      defaultLogLevel) as LOG_SEVERITY_NAME
    this.logThreshold =
      LOG_SEVERITY_MAP[env] ?? LOG_SEVERITY_MAP[defaultLogLevel]
  }
  export(
    logs: ReadableLogRecord[],
    resultCallback: (result: ExportResult) => void
  ): void {
    this._sendLogRecords(logs, resultCallback)
  }

  shutdown(): Promise<void> {
    return Promise.resolve()
  }

  forceFlush(): Promise<void> {
    return Promise.resolve()
  }

  private _sendLogRecords(
    logRecords: ReadableLogRecord[],
    done: (result: ExportResult) => void
  ): void {
    for (const record of logRecords) {
      if ((record.severityNumber ?? 0) >= this.logThreshold) {
        const formatted = formatLogRecord(record)
        const severity = record.severityNumber || SeverityNumber.UNSPECIFIED

        if (severity >= SeverityNumber.ERROR) {
          console.error(formatted)
        } else if (severity >= SeverityNumber.WARN) {
          console.warn(formatted)
        } else if (severity >= SeverityNumber.INFO) {
          console.info(formatted)
        } else if (severity >= SeverityNumber.DEBUG) {
          console.debug(formatted)
        } else {
          console.trace(formatted)
        }
      }
    }

    done?.({ code: ExportResultCode.SUCCESS })
  }
}
