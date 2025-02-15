import { jest } from '@jest/globals'

export const createMockTable = () => ({
  insert: jest.fn(async (rows: unknown[]) =>
    Promise.resolve({
      commitTimestamp: new Date().toISOString(),
      commitStats: { mutationCount: rows.length },
    })
  ),
  update: jest.fn(async (rows: unknown[]) =>
    Promise.resolve({
      commitTimestamp: new Date().toISOString(),
      commitStats: { mutationCount: rows.length },
    })
  ),
  upsert: jest.fn(async (rows: unknown[]) =>
    Promise.resolve({
      commitTimestamp: new Date().toISOString(),
      commitStats: { mutationCount: rows.length },
    })
  ),
  deleteRows: jest.fn(async (keys: string | string[][]) =>
    Promise.resolve({
      commitTimestamp: new Date().toISOString(),
      commitStats: { mutationCount: keys.length },
    })
  ),
  read: jest.fn(async (request: unknown) => Promise.resolve([[]])),
})
