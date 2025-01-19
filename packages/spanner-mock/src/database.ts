import { jest } from '@jest/globals'
import { createMockTable } from './table'
import { createTransaction } from './transaction'

export const createMockDatabase = () => {
  const tables = new Map<string, ReturnType<typeof createMockTable>>()
  const transaction = createTransaction()

  return {
    table: jest.fn((tableName: string) => {
      if (!tables.has(tableName)) {
        tables.set(tableName, createMockTable())
      }
      return tables.get(tableName)
    }),
    run: jest.fn(
      async (query: { sql: string; params?: Record<string, unknown> }) => {
        return [[]] // Mocked query results
      }
    ),
    runTransactionAsync: jest.fn(async (transactionFn: (transaction: any) => Promise<void>) => {
      await transactionFn(transaction)
    }),
    getTransaction: () => transaction, // Expose the transaction for testing
  }
}
