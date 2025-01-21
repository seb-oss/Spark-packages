import type { Database } from '@google-cloud/spanner'
import type { Json } from '@google-cloud/spanner/build/src/codec'
import type { ExecuteSqlRequest } from '@google-cloud/spanner/build/src/transaction'

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
