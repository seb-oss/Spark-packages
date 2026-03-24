import type { Types } from '@opensearch-project/opensearch'
import type { ApiResponse } from '@opensearch-project/opensearch/lib/Transport.js'
import {
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
} from '@opentelemetry/semantic-conventions'

export const extractResponseAttributes = (
  res: ApiResponse
): Record<string, string | number | boolean> => {
  const attrs: Record<string, string | number | boolean> = {}

  const { hostname, port } = res.meta.connection.url
  attrs[ATTR_SERVER_ADDRESS] = hostname
  if (port) attrs[ATTR_SERVER_PORT] = Number(port)
  if (res.statusCode != null)
    attrs['http.response.status_code'] = res.statusCode

  const body = res.body as Types.Core_Search.ResponseBody | null | undefined
  if (body == null) return attrs

  if (body.took != null) attrs['db.opensearch.took'] = body.took
  if (body.timed_out != null) attrs['db.opensearch.timed_out'] = body.timed_out
  if (body.terminated_early != null)
    attrs['db.opensearch.terminated_early'] = body.terminated_early

  const shards = body._shards
  if (shards != null) {
    attrs['db.opensearch.shards.total'] = shards.total
    attrs['db.opensearch.shards.successful'] = shards.successful
    attrs['db.opensearch.shards.failed'] = shards.failed
    if (shards.skipped != null)
      attrs['db.opensearch.shards.skipped'] = shards.skipped
  }

  const phaseTook = body.phase_took
  if (phaseTook != null) {
    attrs['db.opensearch.phase_took.can_match'] = phaseTook.can_match
    attrs['db.opensearch.phase_took.dfs_pre_query'] = phaseTook.dfs_pre_query
    attrs['db.opensearch.phase_took.dfs_query'] = phaseTook.dfs_query
    attrs['db.opensearch.phase_took.expand'] = phaseTook.expand
    attrs['db.opensearch.phase_took.fetch'] = phaseTook.fetch
    attrs['db.opensearch.phase_took.query'] = phaseTook.query
  }

  const total = body.hits?.total
  if (total != null && typeof total === 'object') {
    attrs['db.opensearch.hits.total'] = total.value
  }

  return attrs
}
