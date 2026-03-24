import type { TransportRequestParams } from '@opensearch-project/opensearch/lib/Transport.js'
import type { OpenSearchInstrumentationConfig } from './types'

export const serializeBody = (
  params: TransportRequestParams,
  config: Pick<OpenSearchInstrumentationConfig, 'dbStatementSerializer'>
): string | undefined => {
  if (!params.body) return undefined
  if (config.dbStatementSerializer === false) return undefined
  if (typeof config.dbStatementSerializer === 'function') {
    return config.dbStatementSerializer(params)
  }
  return typeof params.body === 'string'
    ? params.body
    : JSON.stringify(params.body)
}
