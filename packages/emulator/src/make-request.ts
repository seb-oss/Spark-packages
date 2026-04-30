import { callResponder } from './call-responder'
import { normalizeResponder } from './normalize-responder'
import { createStreamHandle } from './stream-handle'
import type {
  Filter,
  MethodCall,
  ReplyInput,
  ResponseCb,
  StoredResponder,
  StreamHandle,
  StreamResponder,
} from './types'

/**
 * Builds the full {@link MethodCall} registration API for one emulator method.
 *
 * The returned function accepts an optional `filter` and exposes:
 * - `.reply(...)` / `.callback(...)` — register a one-shot responder
 * - `.times(n)` / `.persist()` / `.once()` / `.twice()` / `.thrice()` — set
 *   the lifetime before registering
 * - `.stream(initializer)` — register an externally-driven streaming responder
 * - `.pending` — number of unconsumed responders
 * - `.reset()` — clear all responders for this method
 *
 * Each `reply` / `callback` / `stream` call also returns an `execute(...)`
 * helper for invoking the responder directly without going through `.handle`.
 *
 * @template A Arguments type
 * @template R Response type
 *
 * @param responders The live set of responders for this method. Mutations are
 *                   observed immediately by `callResponder` and `.pending`.
 */
export const makeRequest = <A, R>(responders: Set<StoredResponder<A, R>>) => {
  const addResponder = (
    filter: Filter<A> | undefined,
    input: ReplyInput<A, R>,
    remaining: number
  ) => responders.add({ filter, cb: normalizeResponder(input), remaining })

  return (filter?: Filter<A>): MethodCall<A, R> => {
    const builder = (remaining: number) => {
      function reply(response: R): { execute(arg: A): Promise<R> }
      function reply(fn: (args: A) => R | Promise<R>): {
        execute(arg: A): Promise<R>
      }
      // biome-ignore lint/suspicious/noExplicitAny: overload implementation
      function reply(input: any) {
        addResponder(filter, input, remaining)
        return {
          async execute(arg: A): Promise<R> {
            let result!: R
            await callResponder('reply', responders, arg, (r) => {
              result = r
            })
            return result
          },
        }
      }

      function callback(fn: StreamResponder<A, R>): {
        execute(arg: A, cb: (resp: R) => unknown): Promise<void>
      } {
        addResponder(filter, fn, remaining)
        return {
          async execute(arg: A, cb: ResponseCb<R>): Promise<void> {
            await callResponder('callback', responders, arg, cb)
          },
        }
      }

      function stream(initializer: (args: A) => R): StreamHandle<R> {
        return createStreamHandle(initializer, (responder) =>
          addResponder(filter, responder, remaining)
        )
      }

      return { reply, callback, stream }
    }

    return {
      ...builder(1), // default: one-shot
      times: (n: number) => builder(n),
      persist: () => builder(Number.POSITIVE_INFINITY),
      once: () => builder(1),
      twice: () => builder(2),
      thrice: () => builder(3),
      get pending() {
        return responders.size
      },
      reset() {
        responders.clear()
      },
    } as MethodCall<A, R>
  }
}
