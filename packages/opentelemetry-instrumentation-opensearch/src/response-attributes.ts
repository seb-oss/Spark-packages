import type { ApiResponse } from '@opensearch-project/opensearch/lib/Transport.js'
import {
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
} from '@opentelemetry/semantic-conventions'

export const ATTR_DB_OPENSEARCH_DURATION_MS = 'db.opensearch.duration_ms'

type Attributes = Record<string, string | number | boolean>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const setNumber = (attrs: Attributes, key: string, value: unknown) => {
  if (typeof value === 'number') attrs[key] = value
}

const setBoolean = (attrs: Attributes, key: string, value: unknown) => {
  if (typeof value === 'boolean') attrs[key] = value
}

/**
 * Extracts span attributes from an OpenSearch response.
 *
 * The body is that of any API, so search fields are read only when present
 * with the expected type.
 */
export const extractResponseAttributes = (res: ApiResponse): Attributes => {
  const attrs: Attributes = {}

  const { hostname, port } = res.meta.connection.url
  attrs[ATTR_SERVER_ADDRESS] = hostname
  if (port) attrs[ATTR_SERVER_PORT] = Number(port)
  if (res.statusCode != null)
    attrs[ATTR_HTTP_RESPONSE_STATUS_CODE] = res.statusCode

  const body: unknown = res.body
  if (!isRecord(body)) return attrs

  setNumber(attrs, 'db.opensearch.took', body.took)
  setBoolean(attrs, 'db.opensearch.timed_out', body.timed_out)
  setBoolean(attrs, 'db.opensearch.terminated_early', body.terminated_early)

  const shards = body._shards
  if (isRecord(shards)) {
    setNumber(attrs, 'db.opensearch.shards.total', shards.total)
    setNumber(attrs, 'db.opensearch.shards.successful', shards.successful)
    setNumber(attrs, 'db.opensearch.shards.failed', shards.failed)
    setNumber(attrs, 'db.opensearch.shards.skipped', shards.skipped)
  }

  const phaseTook = body.phase_took
  if (isRecord(phaseTook)) {
    for (const phase of [
      'can_match',
      'dfs_pre_query',
      'dfs_query',
      'expand',
      'fetch',
      'query',
    ]) {
      setNumber(attrs, `db.opensearch.phase_took.${phase}`, phaseTook[phase])
    }
  }

  const hits = body.hits
  if (isRecord(hits) && isRecord(hits.total)) {
    setNumber(attrs, 'db.opensearch.hits.total', hits.total.value)
  }

  return attrs
}
