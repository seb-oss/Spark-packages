import { TimeoutError } from './types'

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
  if ((ms as number) > 0) {
    return Promise.race([promise, runTimeoutTimer(ms as number)])
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
export const throttle = <F extends (...args: unknown[]) => Promise<unknown>>(
  fn: F,
  ms: number
) => {
  type R = ReturnType<F> // a Promise<T>

  let current: R | null = null
  let clearHandle: NodeJS.Timeout | null = null

  const wrapped = (...args: Parameters<F>): R => {
    if (!current) {
      current = fn(...args) as R

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

  // Cast to F so the returned function has the *identical* callable type
  return wrapped as unknown as F
}

/**
 * Wraps an async function so that concurrent invocations share the same in-flight Promise.
 * After the Promise settles (resolve or reject), the next call will invoke the function again.
 * Essentially just throttled with timeout 0
 */
export const singleFlight = <
  F extends (...args: unknown[]) => Promise<unknown>,
>(
  fn: F
) => throttle<F>(fn, 0)
