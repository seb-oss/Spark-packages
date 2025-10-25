import { AsyncLocalStorage } from 'node:async_hooks'
import type { NextFunction, Request, Response } from 'express-serve-static-core'

export const asyncLocalStorage = new AsyncLocalStorage<{ startTime: number }>()

export const runWithTiming = async (callback: () => Promise<void>) => {
  return new Promise<void>((res) => {
    const startTime = Date.now()
    asyncLocalStorage.run({ startTime }, async () => {
      await callback()
      res()
    })
  })
}

export const getStartTime = () => {
  return asyncLocalStorage.getStore()?.startTime
}

export const getElapsedTime = () => {
  const startTime = getStartTime()
  if (!startTime) {
    return 0
  }

  return Date.now() - startTime
}

export const timingMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  runWithTiming(async () => {
    const startTime = getStartTime()
    if (startTime) {
      res.setHeader('X-Start-Time', startTime.toString())
    }
    next()
  })
}
