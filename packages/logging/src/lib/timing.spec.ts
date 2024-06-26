import { expect, test, vi } from "vitest"
import {
  asyncLocalStorage,
  runWithTiming,
  getStartTime,
  getElapsedTime,
  timingMiddleware,
} from "./timing"
import { Response } from "express" // Import the Response type from the 'express' package
import { ParamsDictionary } from "express-serve-static-core"
import { Request } from "express"
import { ParsedQs } from "qs"
import { NextFunction } from "express-serve-static-core"

test("getStartTime returns the start time", () => {
  asyncLocalStorage.run({ startTime: 12345 }, () => {
    expect(getStartTime()).toBe(12345)
  })
})

test("getElapsedTime returns the elapsed time", () => {
  asyncLocalStorage.run({ startTime: Date.now() - 1000 }, () => {
    expect(getElapsedTime()).toBeGreaterThanOrEqual(1000)
  })
})

test("getElapsedTime returns 0 if no start time", () => {  
  expect(getElapsedTime()).toBe(0)  
})

test("timingMiddleware sets X-Start-Time header", async () => {
  const req = {} as Request<
    ParamsDictionary,
    any,
    any,
    ParsedQs,
    Record<string, any>
  >
  const res = {
    setHeader: vi.fn(),
  } as unknown as Response<any, Record<string, any>>
  const next = vi.fn() as unknown as NextFunction

  await runWithTiming(async () => {
    timingMiddleware(req, res, next)
  })

  expect(res.setHeader).toHaveBeenCalledWith(
    "X-Start-Time",
    expect.any(String)
  )
  expect(next).toHaveBeenCalled()
})
