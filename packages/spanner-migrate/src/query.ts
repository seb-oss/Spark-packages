import type { Database } from '@google-cloud/spanner'
import type { ExecuteSqlRequest, Json } from './types'

export const runQuery = async <T = Json>(
  database: Database,
  query: string | ExecuteSqlRequest
): Promise<T[]> => {
  const request: ExecuteSqlRequest =
    typeof query === 'string' ? { sql: query } : query

  request.json = true
  const [rows] = await database.run(request)

  // biome-ignore lint/plugin/no-type-assertion: row shape is declared by the caller (trust boundary)
  return rows as T[]
}
