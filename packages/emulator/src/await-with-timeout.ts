import { setTimeout as setTimeoutPromise } from 'node:timers/promises'

/**
 * Races `signal` against a deadline of `ms` milliseconds.
 *
 * - Resolves immediately when `signal` resolves first.
 * - Rejects with a descriptive error when the deadline fires first.
 *
 * Used by {@link createStreamHandle} to give `waitForCall()` a timeout so
 * tests fail fast instead of hanging until Vitest's global test timeout.
 *
 * @param ms     Deadline in milliseconds.
 * @param signal A promise that resolves when the awaited event arrives.
 */
export const awaitWithTimeout = (
  ms: number,
  signal: Promise<void>
): Promise<void> =>
  Promise.race([
    signal,
    setTimeoutPromise(ms).then(() => {
      throw new Error(
        `waitForCall() timed out after ${ms}ms — no request arrived`
      )
    }),
  ])
