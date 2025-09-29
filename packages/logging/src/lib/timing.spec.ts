import type { Request, Response } from 'express'
import type { NextFunction, ParamsDictionary } from 'express-serve-static-core'
import type { ParsedQs } from 'qs'
import { expect, test, vi } from 'vitest'
import {
  asyncLocalStorage,
  getElapsedTime,
  getStartTime,
  runWithTiming,
  timingMiddleware,
} from './timing'

test('getStartTime returns the start time', () => {
  asyncLocalStorage.run({ startTime: 12345 }, () => {
    expect(getStartTime()).toBe(12345)
  })
})

test('getElapsedTime returns the elapsed time', () => {
  asyncLocalStorage.run({ startTime: Date.now() - 1000 }, () => {
    expect(getElapsedTime()).toBeGreaterThanOrEqual(1000)
  })
})

test('getElapsedTime returns 0 if no start time', () => {
  expect(getElapsedTime()).toBe(0)
})

test('timingMiddleware sets X-Start-Time header', async () => {
  const req = {} as Request<
    ParamsDictionary,
    unknown,
    unknown,
    ParsedQs,
    Record<string, unknown>
  >
  const res = {
    setHeader: vi.fn(),
  } as unknown as Response<unknown, Record<string, unknown>>
  const next = vi.fn() as unknown as NextFunction

  await runWithTiming(async () => {
    timingMiddleware(req, res, next)
  })

  expect(res.setHeader).toHaveBeenCalledWith('X-Start-Time', expect.any(String))
  expect(next).toHaveBeenCalled()
})
