import type { Database } from '@google-cloud/spanner'
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest'
import { runQuery } from '../query'

vi.mock('@google-cloud/spanner', () => {
  const db = {}
  const database = vi.fn().mockReturnValue(db)
  const instance = vi.fn().mockReturnValue(database)
  class Spanner {
    instance = instance
  }
  return { Spanner }
})

describe('runQuery', () => {
  let database: Mocked<Database>

  beforeEach(() => {
    database = {
      run: vi.fn().mockResolvedValue([[]]),
    } as unknown as Mocked<Database>
  })

  it('executes a query string and returns the results', async () => {
    const mockRows = [{ id: 1, name: 'Test' }]
    database.run.mockImplementation(async () => [mockRows])

    const query = 'SELECT * FROM users'
    const result = await runQuery(database, query)

    expect(database.run).toHaveBeenCalledWith({ sql: query, json: true })
    expect(result).toEqual(mockRows)
  })

  it('executes an ExecuteSqlRequest and returns the results', async () => {
    const mockRows = [{ id: 2, name: 'Another Test' }]
    database.run.mockImplementation(async () => [mockRows])

    const query = { sql: 'SELECT * FROM roles', params: { roleId: 1 } }
    const result = await runQuery(database, query)

    expect(database.run).toHaveBeenCalledWith({ ...query, json: true })
    expect(result).toEqual(mockRows)
  })

  it('throws an error if the query execution fails', async () => {
    database.run.mockImplementation(async () => {
      throw new Error('Query execution failed')
    })

    const query = 'SELECT * FROM invalid_table'

    await expect(runQuery(database, query)).rejects.toThrow(
      'Query execution failed'
    )

    expect(database.run).toHaveBeenCalledWith({ sql: query, json: true })
  })
})
