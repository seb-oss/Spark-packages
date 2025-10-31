import type { Database } from '@google-cloud/spanner'
import type { ExecuteSqlRequest, Json } from './types.js'

export const runQuery = async <T = Json>(
  database: Database,
  query: string | ExecuteSqlRequest
): Promise<T[]> => {
  const request: ExecuteSqlRequest =
    typeof query === 'string' ? { sql: query } : (query as ExecuteSqlRequest)

  request.json = true
  const [rows] = await database.run(request)

  return rows as T[]
}
