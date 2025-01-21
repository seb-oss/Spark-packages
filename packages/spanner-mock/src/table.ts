import { jest } from '@jest/globals'

export const createMockTable = () => ({
  upsert: jest.fn(async (_rows: unknown[]): Promise<void> => {
    return
  }),
})
