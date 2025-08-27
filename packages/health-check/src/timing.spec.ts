import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  runAgainstTimeout,
  runTimeoutTimer,
  singleFlight,
  throttle,
  wait,
} from './timing'
import { TimeoutError } from './types'

describe('TimeoutError', () => {
  it('is an Error with the expected name and message', () => {
    const err = new TimeoutError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('TimeoutError')
    expect(err.message).toBe('timeout')
  })
})

describe('wait', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('resolves after the specified time', async () => {
    const done = vi.fn()
    const p = wait(500).then(done)

    await vi.advanceTimersByTimeAsync(499)
    expect(done).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(done).toHaveBeenCalled()

    await p
  })
})

describe('runTimeoutTimer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('rejects with TimeoutError after the specified time', async () => {
    const success = vi.fn()
    const fail = vi.fn()
    runTimeoutTimer(300).then(success).catch(fail)

    await vi.advanceTimersByTimeAsync(299)
    expect(success).not.toHaveBeenCalled()
    expect(fail).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(299)
    expect(success).not.toHaveBeenCalled()
    expect(fail).toHaveBeenCalledWith(expect.any(TimeoutError))
  })
})

describe('runAgainstTimeout', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('passes through when ms is undefined or 0', async () => {
    const fast = Promise.resolve('ok')
    await expect(runAgainstTimeout(fast, undefined)).resolves.toBe('ok')
    await expect(runAgainstTimeout(fast, 0)).resolves.toBe('ok')
  })
  it('resolves when the promise settles before timeout', async () => {
    const success = vi.fn()
    const fail = vi.fn()

    const base = wait(100).then(() => 'ok')
    runAgainstTimeout(base, 1000).then(success).catch(fail)

    vi.runAllTicks()
    await vi.runAllTimersAsync()

    expect(success).toHaveBeenCalledWith('ok')
    expect(fail).not.toHaveBeenCalled()
  })
  it('rejects with TimeoutError if promise does not settle before timeout', async () => {
    const success = vi.fn()
    const fail = vi.fn()

    const base = wait(1000).then(() => 'ok')
    runAgainstTimeout(base, 100).then(success).catch(fail)

    vi.runAllTicks()
    await vi.runAllTimersAsync()

    expect(success).not.toHaveBeenCalled()
    expect(fail).toHaveBeenCalledWith(expect.any(TimeoutError))
  })
})

describe('throttled', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('coalesces concurrent calls into a single in-flight promise', async () => {
    const fn = vi.fn(async () => 'value')
    const throttled = throttle(fn, 2000)

    const p1 = throttled()
    const p2 = throttled()
    const p3 = throttled()

    await Promise.resolve()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(p2).toBe(p1)
    expect(p3).toBe(p1)

    await expect(p1).resolves.toBe('value')
  })

  it('retains the settled promise for ms (success case), then clears', async () => {
    const fn = vi.fn(async () => 'v')
    const throttled = throttle(fn, 1000)

    const p1 = throttled()
    await expect(p1).resolves.toBe('v')
    expect(fn).toHaveBeenCalledTimes(1)

    // Within retention window → returns the same settled promise
    const p2 = throttled()
    expect(p2).toBe(p1)
    await expect(p2).resolves.toBe('v')
    expect(fn).toHaveBeenCalledTimes(1)

    // After retention window → new call occurs
    await vi.advanceTimersByTimeAsync(1000)
    const p3 = throttled()
    await Promise.resolve()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(p3).not.toBe(p1)
    await expect(p3).resolves.toBe('v')
  })
})

describe('singleFlight', () => {
  it('collapses only during in-flight and clears immediately after settle', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const wrapped = singleFlight(fn)

    // Concurrent calls share one in-flight promise
    const p1 = wrapped()
    const p2 = wrapped()
    await Promise.resolve()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(p2).toBe(p1)
    await expect(p1).resolves.toBe('ok')

    // After settle (ms = 0), a new call should trigger again
    const p3 = wrapped()
    await Promise.resolve()

    expect(fn).toHaveBeenCalledTimes(2)
    expect(p3).not.toBe(p1)
    await expect(p3).resolves.toBe('ok')
  })
})
