import { awaitWithTimeout } from './await-with-timeout'
import type { ResponseCb, StreamHandle, StreamResponder } from './types'

/**
 * Creates a {@link StreamHandle} for a single externally-driven streaming
 * responder and registers it with the emulator via `register`.
 *
 * ### How it works
 *
 * When a request arrives the registered `responder`:
 * 1. Calls `initializer(args)` to produce the first response and delivers it
 *    to the transport via `cb`.
 * 2. Pushes an entry onto `queue` and parks — keeping the streaming connection
 *    open — until `waitForCall()` dequeues it.
 *
 * `waitForCall()` picks up entries in arrival order (FIFO within a single
 * `StreamHandle`). After dequeuing, `send()` targets that connection until
 * the next `waitForCall()`.
 *
 * ### Queue / wakeup protocol
 *
 * `queueResolve` is the resolve function of the Promise that `waitForCall()`
 * is currently awaiting. When the responder pushes onto the queue it calls
 * `queueResolve` to wake the waiting `waitForCall()`. If `waitForCall()` is
 * not yet parked, `queueResolve` is null and the responder simply pushes —
 * `waitForCall()` will find the entry already in the queue when it runs.
 *
 * @template A Arguments type for the request
 * @template R Response type
 *
 * @param initializer Produces the first response from the incoming args.
 * @param register    Callback that stores the responder in the emulator's set.
 */
export const createStreamHandle = <A, R>(
  initializer: (args: A) => R,
  register: (responder: StreamResponder<A, R>) => void
): StreamHandle<R> => {
  const queue: Array<{ resolve: () => void; transportCb: ResponseCb<R> }> = []
  let queueResolve: (() => void) | null = null
  let activeTransportCb: ResponseCb<R> | null = null
  let latestResponse: R | undefined
  let hasBeenCalled = false

  const responder: StreamResponder<A, R> = async (args, cb) => {
    latestResponse = initializer(args)
    activeTransportCb = cb
    await cb(latestResponse)

    // Park here, keeping the streaming connection open, until waitForCall()
    // dequeues this entry and calls entry.resolve().
    await new Promise<void>((resolve) => {
      queue.push({ resolve, transportCb: cb })
      if (queueResolve) {
        const wake = queueResolve
        queueResolve = null
        wake()
      }
    })
  }
  register(responder)

  return {
    get latestResponse() {
      return latestResponse
    },
    get hasBeenCalled() {
      return hasBeenCalled
    },

    async waitForCall(timeoutMs = 5000): Promise<void> {
      if (queue.length === 0) {
        const arrived = new Promise<void>((resolve) => {
          queueResolve = resolve
        })
        await awaitWithTimeout(timeoutMs, arrived)
      }
      const entry = queue.shift()
      /* istanbul ignore next */
      if (!entry) throw new Error('Stream queue is empty')
      activeTransportCb = entry.transportCb
      hasBeenCalled = true
      entry.resolve()
    },

    async send(modifier: (prev: R) => R): Promise<void> {
      if (activeTransportCb === null) {
        throw new Error('No active stream — call waitForCall() first')
      }
      const next = modifier(latestResponse as R)
      latestResponse = next
      await activeTransportCb(next)
    },
  }
}
