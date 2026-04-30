import { describe, expect, it } from 'vitest'
import { awaitWithTimeout } from './await-with-timeout'

describe('awaitWithTimeout', () => {
  it('resolves when the signal resolves before the deadline', async () => {
    const signal = Promise.resolve()
    await expect(awaitWithTimeout(1000, signal)).resolves.toBeUndefined()
  })

  it('rejects when the deadline expires before the signal', async () => {
    const signal = new Promise<void>(() => {
      // never resolves
    })
    await expect(awaitWithTimeout(10, signal)).rejects.toThrow(
      'waitForCall() timed out after 10ms — no request arrived'
    )
  })

  it('includes the deadline in the error message', async () => {
    const signal = new Promise<void>(() => {})
    await expect(awaitWithTimeout(42, signal)).rejects.toThrow('42ms')
  })
})
