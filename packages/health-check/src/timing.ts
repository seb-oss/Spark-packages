import { TimeoutError } from './types'

// Global setTimeout on purpose: node:timers/promises is not controlled by
// vi.useFakeTimers(), so switching would change timing for consumers' tests.
export const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

export const runTimeoutTimer = async (ms: number) => {
  await wait(ms)
  throw new TimeoutError()
}

export const runAgainstTimeout = <T>(
  promise: Promise<T>,
  ms?: number | undefined
): Promise<T> => {
  if (ms !== undefined && ms > 0) {
    return Promise.race([promise, runTimeoutTimer(ms)])
  }

  return promise
}

/**
 * Throttles an async function:
 *  - coalesces concurrent calls into a single in-flight Promise,
 *  - after it settles, reuses that settled Promise for `ms` ms,
 *  - then clears so the next call invokes `fn` again.
 *
 * Fully preserves the original function signature.
 */
export const throttle = <A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
  ms: number
): ((...args: A) => Promise<T>) => {
  let current: Promise<T> | null = null
  let clearHandle: NodeJS.Timeout | null = null

  return (...args: A): Promise<T> => {
    if (!current) {
      current = fn(...args)

      /* istanbul ignore next */
      if (clearHandle) {
        clearTimeout(clearHandle)
        clearHandle = null
      }

      const schedule = () => {
        if (ms > 0) {
          clearHandle = setTimeout(
            /* istanbul ignore next */ () => {
              current = null
              clearHandle = null
            },
            ms
          )
        } else {
          current = null
        }
      }
      current.then(schedule, schedule)
    }

    return current
  }
}

/**
 * Wraps an async function so that concurrent invocations share the same in-flight Promise.
 * After the Promise settles (resolve or reject), the next call will invoke the function again.
 * Essentially just throttled with timeout 0
 */
export const singleFlight = <A extends unknown[], T>(
  fn: (...args: A) => Promise<T>
) => throttle(fn, 0)
