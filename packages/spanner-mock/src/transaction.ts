import { jest } from '@jest/globals'

type ResolveReject = (value?: unknown) => void

export const createTransaction = () => {
  let resolve: ResolveReject
  let reject: ResolveReject
  return {
    run: jest.fn(async (statement: string) => {
    }),
    runUpdate: jest.fn(async (statement: string) => {
    }),
    commit: jest.fn(async () => {
      resolve()
    }),
    rollback: jest.fn(async () => {
      reject(new Error())
    }),
    setCallbacks: (
      _resolve: (value?: unknown) => void,
      _reject: (err: unknown) => void,
    ) => {
      resolve = _resolve
      reject = _reject
    }
  }
}
