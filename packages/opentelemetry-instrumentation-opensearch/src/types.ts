import type {
  ApiResponse,
  TransportRequestParams,
} from '@opensearch-project/opensearch/lib/Transport.js'
import type { Span } from '@opentelemetry/api'
import type { InstrumentationConfig } from '@opentelemetry/instrumentation'

export interface OpenSearchInstrumentationConfig extends InstrumentationConfig {
  dbStatementSerializer?: false | ((params: TransportRequestParams) => string)
  requestHook?: (span: Span, params: TransportRequestParams) => void
  responseHook?: (span: Span, response: ApiResponse) => void
  suppressInternalInstrumentation?: boolean
  moduleVersionAttributeName?: string
}
