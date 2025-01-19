import { jest } from '@jest/globals'

export const createTransaction = () => {
  return {
    run: jest.fn(async (statement: string) => {
      return [[]] // Mocked query results
    }),
    commit: jest.fn(async () => {
    }),
    rollback: jest.fn(async () => {
    }),
  }
}
