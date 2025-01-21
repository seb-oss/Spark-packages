import { jest } from '@jest/globals'
import { createMockDatabase } from './database'

export const createMockInstance = () => {
  const databases = new Map<string, ReturnType<typeof createMockDatabase>>()
  return {
    database: jest.fn((dbName: string) => {
      if (!databases.has(dbName)) {
        databases.set(dbName, createMockDatabase())
      }
      return databases.get(dbName)
    }),
  }
}
