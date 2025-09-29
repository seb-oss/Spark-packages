export type WaitForConfig = {
  /** How often to retry (ms). Default: 50 */
  pollingInterval?: number
  /** Give up after this long (ms). Default: 2000 */
  timeout?: number
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Repeatedly executes `fn` until it stops throwing or the timeout elapses.
 * If time runs out, rethrows the last error from `fn`.
 *
 * Usage:
 *   await waitFor(() => expect(spy).toHaveBeenCalled())
 */
export async function waitFor(
  fn: () => void | Promise<void>,
  { pollingInterval = 50, timeout = 2000 }: WaitForConfig = {}
): Promise<void> {
  const start = Date.now()
  let lastErr: unknown

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await fn()
      return
    } catch (err) {
      lastErr = err
    }

    if (Date.now() - start >= timeout) {
      if (lastErr instanceof Error) throw lastErr
      throw new Error(String(lastErr))
    }
    await sleep(pollingInterval)
  }
}
