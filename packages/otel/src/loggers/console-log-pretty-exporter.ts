import { SeverityNumber } from '@opentelemetry/api'
import { type ExportResult, ExportResultCode } from '@opentelemetry/core'
import type {
  LogRecordExporter,
  ReadableLogRecord,
} from '@opentelemetry/sdk-logs'
import { logThresholdFromEnv } from '../consts'
import { formatLogRecord } from './formatters/index'

export class ConsoleLogPrettyExporter implements LogRecordExporter {
  private readonly logThreshold: number
  constructor() {
    this.logThreshold = logThresholdFromEnv()
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
        /* istanbul ignore next */
        const severity = record.severityNumber || SeverityNumber.UNSPECIFIED

        if (severity >= SeverityNumber.ERROR) {
          console.error(formatted)
        } else if (severity >= SeverityNumber.WARN) {
          console.log(formatted)
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
