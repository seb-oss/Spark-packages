import { callResponder } from './call-responder'
import { makeRequest } from './make-request'
import type {
  Filter,
  MethodCall,
  MethodMap,
  ResponseCb,
  StoredResponder,
} from './types'

/**
 * Creates a generic, type-safe emulator for a given {@link MethodMap}.
 *
 * The emulator uses a `Proxy` so you only need a *type* — no runtime object
 * describing the method map is required.
 *
 * ### Per-method registration API
 *
 * For every method key `M` in `T`, the emulator exposes `emu.M(filter?)` which
 * returns a {@link MethodCall} builder. From there you can:
 *
 * | Chain | Effect |
 * |---|---|
 * | `.reply(value \| fn)` | Register a single-response responder |
 * | `.callback(fn)` | Register a streaming responder |
 * | `.stream(initializer)` | Register an externally-driven streaming responder |
 * | `.times(n)` | Limit the next responder to `n` uses |
 * | `.persist()` | Make the next responder permanent |
 * | `.once()` / `.twice()` / `.thrice()` | Shorthands for `.times(1/2/3)` |
 * | `.pending` | Number of unconsumed responders for this method |
 * | `.reset()` | Remove all responders for this method |
 *
 * ### Dispatch
 *
 * `emu.handle(method, args, cb)` dispatches a request to the highest-priority
 * matching responder and streams responses through `cb`. This is the entry
 * point called by your transport adapter (HTTP handler, Pub/Sub listener, etc.).
 *
 * ### Responder resolution
 *
 * Responders are matched in **strict LIFO order**: the most recently registered
 * responder that passes its filter (if any) is invoked. Only one responder
 * handles a given request.
 *
 * @template T The `MethodMap` describing every method, its args, and its response.
 *
 * @example
 * type Api = {
 *   greet: { args: { name: string }; resp: { message: string } }
 * }
 *
 * const emu = createEmulator<Api>()
 *
 * emu.greet().reply({ message: 'hello' })
 * await emu.handle('greet', { name: 'Alice' }, (r) => console.log(r))
 */
export const createEmulator = <T extends MethodMap>() => {
  // biome-ignore lint/suspicious/noExplicitAny: MethodMap keys are resolved at call sites
  const responders = new Map<keyof T, Set<StoredResponder<any, any>>>()

  const getOrCreateSet = (method: keyof T) => {
    let set = responders.get(method)
    if (!set) {
      set = new Set()
      responders.set(method, set)
    }
    return set
  }

  // biome-ignore lint/suspicious/noExplicitAny: Proxy handler operates on unknown keys
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'reset') {
        return () => {
          for (const set of responders.values()) set.clear()
        }
      }

      if (prop === 'handle') {
        return async <M extends keyof T>(
          method: M,
          args: T[M]['args'],
          cb: ResponseCb<T[M]['resp']>
        ): Promise<void> =>
          callResponder(method as string, getOrCreateSet(method), args, cb)
      }

      if (prop === 'dispose' || typeof prop === 'symbol') {
        /* istanbul ignore next */ return Reflect.get(_target, prop)
      }

      /* istanbul ignore else */
      if (typeof prop === 'string') {
        // biome-ignore lint/suspicious/noExplicitAny: filter type is resolved at call site
        return (filter?: Filter<any>) =>
          makeRequest(getOrCreateSet(prop as keyof T))(filter)
      }

      /* istanbul ignore next */
      return undefined
    },
  }

  return new Proxy({}, handler) as {
    [M in keyof T]: (
      filter?: Filter<T[M]['args']>
    ) => MethodCall<T[M]['args'], T[M]['resp']>
  } & {
    handle<M extends keyof T>(
      method: M,
      args: T[M]['args'],
      cb: ResponseCb<T[M]['resp']>
    ): Promise<void>
    /** Removes all registered responders across every method. */
    reset(): void
  }
}
