import { jest } from '@jest/globals'

type ResolveReject = (value?: unknown) => void
type Key = string | string[]

export const createTransaction = () => {
  let resolve: ResolveReject | undefined = undefined
  let reject: ResolveReject | undefined = undefined
  return {
    run: jest.fn((statement: string) => {}),
    runUpdate: jest.fn(async (statement: string) => [1]),
    insert: jest.fn((table: string, rows: unknown[]) => {}),
    update: jest.fn((table: string, rows: unknown[]) => {}),
    deleteRows: jest.fn((table: string, keys: Key[]) => {}),
    read: jest.fn((table: string, keys: Key[], columns: string[]) => {}),
    readStream: jest.fn((table: string, keys: Key[], columns: string[]) => {}),
    query: jest.fn((request: { sql: string }) => {}),
    queryStream: jest.fn((request: { sql: string }) => {}),
    getReadTimestamp: jest.fn(() => {}),
    getCommitTimestamp: jest.fn(() => {}),
    commit: jest.fn(async () => {
      if (resolve) {
        resolve([])
        resolve = undefined
        reject = undefined
      } else {
        return []
      }
    }),
    rollback: jest.fn(async () => {
      const error = new Error()
      if (reject) {
        reject(error)
        resolve = undefined
        reject = undefined
      } else {
        throw error
      }
    }),
    setCallbacks: (
      _resolve: (value?: unknown) => void,
      _reject: (err: unknown) => void
    ) => {
      resolve = _resolve
      reject = _reject
    },
  }
}
