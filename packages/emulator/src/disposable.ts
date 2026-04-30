import type { Disposable } from './types'

export type { Disposable }

/**
 * Wraps any object with explicit and symbol-based disposal semantics.
 *
 * The returned object passes all method calls through to `emulator` and
 * additionally exposes:
 *
 * - `.dispose()` — explicit cleanup (calls `dispose` callback)
 * - `[Symbol.dispose]()` — enables synchronous `using` (Node 20+)
 * - `[Symbol.asyncDispose]()` — enables `await using` (Node 20+)
 *
 * @example
 * const gateway = disposable(createEmulator<PaymentMethodMap>(), () => server.close())
 * // In a test:
 * await using gateway = startPaymentEmulator(server)
 *
 * @template T The base emulator type.
 */
export const disposable = <T>(
  emulator: T,
  dispose: () => void | Promise<void>
): Disposable<T> => {
  const d = emulator as Disposable<T>
  d.dispose = dispose
  d[Symbol.dispose] = dispose
  d[Symbol.asyncDispose] = dispose as () => Promise<void>
  return d
}
