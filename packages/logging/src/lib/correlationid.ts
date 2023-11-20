import { randomUUID } from 'crypto'
import { AsyncLocalStorage } from 'async_hooks'
import type { NextFunction, Request, Response } from 'express'

const asyncLocalStorage = new AsyncLocalStorage<{ corrId: string }>()

export const CorrIdHeaderName = 'X-Correlation-Id'

export const runWithCorrelationId = async (
  callback: () => Promise<void>,
  existingCorrId?: string
) => {
  return new Promise<void>((res) => {
    const corrId = existingCorrId ?? randomUUID().substring(0, 8)
    asyncLocalStorage.run({ corrId }, async () => {
      await callback()
      res()
    })
  })
}

export const getCorrId = () => {
  return asyncLocalStorage.getStore()?.corrId
}

export const correlationIdMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  runWithCorrelationId(async () => {
    next()
  }, req.get(CorrIdHeaderName))
}
