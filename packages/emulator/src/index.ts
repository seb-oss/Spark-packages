/**
 * A filter function that decides whether a responder should be used
 * for a given request. If the function returns `true`, the responder
 * is eligible to handle the request; otherwise it is skipped.
 *
 * @template A Arguments type for the request
 * @param args The request arguments
 * @returns `true` if this responder should handle the request
 */
type Filter<A> = (args: A) => boolean

/**
 * Callback invoked by a responder whenever it emits a response.
 * This may be called once for simple responders, or many times
 * for streaming responders.
 *
 * @template R Response type
 * @param resp A response object of type `R`
 * @returns An arbitrary value; ignored by the emulator.
 */
type ResponseCb<R> = (resp: R) => unknown

/**
 * The normalized internal responder form. Regardless of whether
 * the user provided a static response, a function, or a streaming
 * callback, it is converted into this form internally.
 *
 * @template A Arguments type for the request
 * @template R Response type
 * @param args The request arguments
 * @param cb A callback to deliver one or more responses
 * @returns Nothing meaningful; may be synchronous or asynchronous
 */
type StreamResponder<A, R> = (
  args: A,
  cb: ResponseCb<R>
) => void | Promise<void>

/**
 * The user-facing responder input form. When registering responders,
 * users can choose one of three styles:
 *
 * 1. **Static response** — provide a plain object of type `R`.
 *    Example: `.reply({ ok: true })`
 *
 * 2. **Function responder** — provide a function `(args) => R | Promise<R>`
 *    that computes a single response from the request arguments.
 *    Example: `.reply(args => ({ ok: args.id > 0 }))`
 *
 * 3. **Streaming responder** — provide a function `(args, cb) => { ... }`
 *    that can invoke `cb(r)` one or more times to emit multiple responses.
 *    Example:
 *    ```ts
 *    .callback((args, cb) => {
 *      cb({ step: 1 })
 *      cb({ step: 2 })
 *    })
 *    ```
 *
 * All three forms are internally normalized into a {@link StreamResponder}.
 *
 * @template A Arguments type
 * @template R Response type
 */
type ReplyInput<A, R> =
  | R
  | ((args: A) => R | Promise<R>)
  | StreamResponder<A, R>

/**
 * Internal structure representing a registered responder.
 *
 * @template A Arguments type
 * @template R Response type
 *
 * @property filter    Optional {@link Filter} restricting which requests
 *                     this responder will handle
 * @property cb        The normalized {@link StreamResponder} to invoke
 * @property remaining How many times this responder may be invoked.
 *                     - `Infinity` = unlimited (persist)
 *                     - `n`        = valid for `n` calls
 *                     - `1`        = one-shot
 */
interface StoredResponder<A, R> {
  filter?: Filter<A>
  cb: StreamResponder<A, R>
  remaining: number
}

/**
 * A handle returned by `.stream()` that lets a test drive a stateful,
 * externally-controlled streaming responder.
 *
 * - `waitForCall()` — resolves when the next request has arrived and the
 *   initializer has been called. Each invocation dequeues the next pending
 *   request in arrival order.
 * - `send(modifier)` — derives a new response from `latestResponse` and
 *   delivers it via the transport callback. Throws if called before
 *   `waitForCall()` resolves.
 * - `latestResponse` — the most recent response emitted for the active stream,
 *   or `undefined` before `waitForCall()` resolves.
 *
 * @template R Response type
 */
export interface StreamHandle<R> {
  waitForCall(): Promise<void>
  send(modifier: (prev: R) => R): Promise<void>
  readonly latestResponse: R | undefined
  /** `true` once the first `waitForCall()` has resolved. */
  readonly hasBeenCalled: boolean
}

/**
 * Builder API returned by `.times(n)` or `.persist()`.
 *
 * These builders let you specify how many times a responder should be used:
 * - `.times(n)` → expires after `n` uses
 * - `.persist()` → never expires
 *
 * They expose the same responder registration methods as normal:
 * - `.reply(response | fn)` → single-response style
 * - `.callback(fn)` → streaming style
 * - `.stream(initializer)` → externally-driven streaming style
 *
 * Each returns an `execute(...)` helper for direct invocation.
 *
 * Note: `.pending()` and `.reset()` are on {@link MethodCall} (before lifetime
 * configuration), not on this builder — they operate on the method as a whole.
 */
interface MethodCallBuilder<A, R> {
  reply(response: R): { execute(arg: A): Promise<R> }
  reply(fn: (args: A) => R | Promise<R>): { execute(arg: A): Promise<R> }

  callback(fn: (args: A, cb: (resp: R) => unknown) => unknown): {
    execute(arg: A, cb: (resp: R) => unknown): Promise<void>
  }

  stream(initializer: (args: A) => R): StreamHandle<R>
}

/**
 * The full API available for each method in the emulator.
 *
 * By default, `.reply`, `.callback`, and `.stream` register **single-use** responders.
 * For repeated use, chain `.times(n)` or `.persist()`.
 *
 * - `.reply(...)` — one-time single-response responder
 * - `.callback(...)` — one-time streaming responder
 * - `.stream(initializer)` — externally-driven streaming responder
 * - `.times(n)` — limit responder to `n` uses
 * - `.persist()` — make responder permanent (infinite uses)
 * - `.once()` / `.twice()` / `.thrice()` — convenience aliases for `.times(1/2/3)`
 *
 * Each registration returns an `execute(...)` helper for direct invocation.
 */
interface MethodCall<A, R> {
  // One-time single-response
  reply(response: R): { execute(arg: A): Promise<R> }
  reply(fn: (args: A) => R | Promise<R>): { execute(arg: A): Promise<R> }

  // One-time streaming
  callback(fn: (args: A, cb: (resp: R) => unknown) => unknown): {
    execute(arg: A, cb: (resp: R) => unknown): Promise<void>
  }

  // Externally-driven streaming
  stream(initializer: (args: A) => R): StreamHandle<R>

  // Lifetime configuration
  times(n: number): MethodCallBuilder<A, R>
  persist(): MethodCallBuilder<A, R>

  // Aliases
  once(): MethodCallBuilder<A, R>
  twice(): MethodCallBuilder<A, R>
  thrice(): MethodCallBuilder<A, R>

  /** The number of responders registered for this method that have not yet been fully consumed. */
  readonly pending: number

  /** Removes all registered responders for this method. */
  reset(): void
}

/**
 * Describes the shape of all methods supported by an emulator.
 *
 * Each entry in the map defines:
 * - `args`: the type of the request arguments the method accepts
 * - `resp`: the type of the responses the method will emit
 *
 * The map is only used at the type level. At runtime, methods are
 * generated dynamically using a Proxy, so no actual object is required.
 */
// biome-ignore lint/suspicious/noExplicitAny: emulator code
export type MethodMap = Record<string, { args: any; resp: any }>

/**
 * Converts any user-supplied responder into the internal
 * streaming responder form `(args, cb) => void | Promise<void>`.
 *
 * This allows the emulator to treat all responders uniformly,
 * regardless of whether they were registered as:
 * - A static response object of type `R`
 * - A simple function `(args) => R | Promise<R>` returning a single response
 * - A streaming function `(args, cb) => { cb(r1); cb(r2); ... }`
 *
 * @template A Arguments type for the request
 * @template R Response type
 *
 * @param input The user-supplied responder or response
 * @returns A {@link StreamResponder} that invokes the callback appropriately
 */
const normalizeResponder = <A, R>(
  input: ReplyInput<A, R>
): StreamResponder<A, R> => {
  if (typeof input === 'function') {
    // Either (args) => R or (args, cb) => void
    if (input.length >= 2) {
      // Already a streaming responder
      return input as StreamResponder<A, R>
    }
    // Single-response function
    return async (args, cb) => {
      const result = await (input as (args: A) => R | Promise<R>)(args)
      await cb(result)
    }
  }
  // Static response object
  return async (_args, cb) => {
    await cb(input)
  }
}

/**
 * Creates the responder registration API for a single method.
 *
 * For the given set of responders, this function returns a builder
 * `(filter?) => MethodCall<A, R>` which allows users to register responders
 * with optional filter logic.
 *
 * The returned {@link MethodCall} supports:
 * - `.reply(...)` / `.callback(...)` → one-time responders (default)
 * - `.times(n)` → responders valid for `n` calls
 * - `.persist()` → responders valid forever
 * - `.once()` / `.twice()` / `.thrice()` → shorthand for `.times(1/2/3)`
 *
 * Each of these also returns an `.execute(...)` convenience helper
 * to directly trigger the responder logic without going through `.handle`.
 *
 * Responder resolution is **strict LIFO**:
 * - The most recently added matching responder is chosen.
 * - Filters are applied, but do not affect ordering.
 *
 * @template A Arguments type for the request
 * @template R Response type
 *
 * @param responders The set of responders registered for this method
 * @returns A function `(filter?) => MethodCall<A, R>` that exposes
 *          the responder registration API for this method
 */
const makeRequest = <A, R>(responders: Set<StoredResponder<A, R>>) => {
  function addResponder(
    filter: Filter<A> | undefined,
    input: ReplyInput<A, R>,
    remaining: number
  ) {
    responders.add({ filter, cb: normalizeResponder(input), remaining })
  }

  return (filter?: Filter<A>): MethodCall<A, R> => {
    const builder = (remaining: number) => {
      function reply(response: R): { execute(arg: A): Promise<R> }
      function reply(fn: (args: A) => R | Promise<R>): {
        execute(arg: A): Promise<R>
      }
      // biome-ignore lint/suspicious/noExplicitAny: emulator code
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
          async execute(arg: A, cb: (resp: R) => unknown): Promise<void> {
            await callResponder('callback', responders, arg, cb)
          },
        }
      }

      function stream(initializer: (args: A) => R): StreamHandle<R> {
        // Queue of { resolve, transportCb } entries — one per accepted request.
        const queue: Array<{
          resolve: () => void
          transportCb: ResponseCb<R>
        }> = []
        let queueResolve: (() => void) | null = null

        let activeTransportCb: ResponseCb<R> | null = null
        let latestResponse: R | undefined
        let hasBeenCalled = false

        // Register the underlying streaming responder.
        const responder: StreamResponder<A, R> = async (args, cb) => {
          const initial = initializer(args)
          latestResponse = initial
          activeTransportCb = cb
          await cb(initial)

          // Park until waitForCall() dequeues this entry.
          await new Promise<void>((resolve) => {
            queue.push({ resolve, transportCb: cb })
            if (queueResolve) {
              const wake = queueResolve
              queueResolve = null
              wake()
            }
          })
        }
        addResponder(filter, responder, remaining)

        const handle: StreamHandle<R> = {
          get latestResponse() {
            return latestResponse
          },
          get hasBeenCalled() {
            return hasBeenCalled
          },

          async waitForCall(): Promise<void> {
            // Wait if no request has arrived yet.
            if (queue.length === 0) {
              await new Promise<void>((resolve) => {
                queueResolve = resolve
              })
            }
            const entry = queue.shift()
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

        return handle
      }

      return { reply, callback, stream }
    }

    return {
      ...builder(1), // default: one-shot
      times(n: number) {
        return builder(n)
      },
      persist() {
        return builder(Number.POSITIVE_INFINITY)
      },
      once() {
        return builder(1)
      },
      twice() {
        return builder(2)
      },
      thrice() {
        return builder(3)
      },
      get pending() {
        return responders.size
      },
      reset() {
        responders.clear()
      },
    } as MethodCall<A, R>
  }
}

/**
 * Dispatch a request to the highest-priority matching responder.
 *
 * - Responders are resolved in **strict LIFO order**:
 *   - The most recently registered responder that matches the request
 *     (by filter, if provided) is invoked.
 *   - Only one responder is invoked per request, even if others also match.
 *
 * - Streaming responders may call the provided callback multiple times.
 * - Responders created with `.reply()` / `.callback()` are single-use by default.
 *   Use `.times(n)` or `.persist()` to extend their lifetime.
 *
 * @template T The full MethodMap type
 * @template M The specific method name
 *
 * @param methodName The name of the method (for error messages)
 * @param responders The set of responders registered for the method
 * @param args       The request arguments to match against filters
 * @param cb         Callback used to deliver one or more responses
 *
 * @throws {Error} If no matching responder is found
 */
const callResponder = async <T extends MethodMap, M extends keyof T>(
  methodName: string,
  responders: Set<StoredResponder<T[M]['args'], T[M]['resp']>>,
  args: T[M]['args'],
  cb: ResponseCb<T[M]['resp']>
): Promise<void> => {
  // Collect responders in insertion order, then reverse for LIFO
  const [chosen] = [...responders]
    .reverse()
    .filter((r) => !r.filter || r.filter(args))

  if (!chosen) {
    throw new Error(
      `No responder found for .${methodName}(${args && JSON.stringify(args)})`
    )
  }

  // Decrement before invoking so that concurrent/subsequent requests see the
  // updated count immediately — even for long-lived streaming responders whose
  // body only completes when the test calls waitForCall().
  if (chosen.remaining !== Number.POSITIVE_INFINITY) {
    chosen.remaining -= 1
    if (chosen.remaining <= 0) {
      responders.delete(chosen)
    }
  }

  await chosen.cb(args, cb)
}

/**
 * Create a generic emulator for a given `MethodMap`.
 *
 * - Uses a Proxy so you only need a *type* for your method map — no
 *   runtime object is required.
 *
 * - For each method key in the `MethodMap`, the emulator provides:
 *   - `.reply(response | fn)` — one-time static or single-response functions
 *   - `.callback(fn)` — one-time streaming responders
 *   - `.times(n)` — responders valid for `n` calls
 *   - `.persist()` — responders valid forever
 *   - `.once()` / `.twice()` / `.thrice()` — shorthands for `.times(1/2/3)`
 *
 * - Responders are matched in **strict LIFO order**:
 *   - The most recently registered matching responder is invoked first.
 *   - Only one responder handles a given request, even if others also match.
 *   - Filters still apply: a responder is considered only if its filter
 *     returns `true` (or it has no filter).
 *
 * - Provides `.handle(method, args, cb)` to manually dispatch a request
 *   to the appropriate responder and stream results via the callback.
 *
 * @template T The `MethodMap` describing all methods, their args and responses
 * @returns An emulator object with per-method registration APIs and a
 *          `.handle` dispatcher
 *
 * @example
 * type MyMethodMap = {
 *   echo: { args: { msg: string }, resp: { echoed: string } }
 *   double: { args: { n: number }, resp: { result: number } }
 * }
 *
 * const emu = createEmulator<MyMethodMap>()
 *
 * emu.echo().reply({ echoed: 'hello' }) // one-time
 * emu.echo().persist().reply({ echoed: 'always' }) // infinite
 *
 * const r1 = await emu.echo().times(2).reply(args => ({ echoed: args.msg }))
 *   .execute({ msg: 'hi' })
 *
 * emu.double().callback((args, cb) => {
 *   cb({ result: args.n })
 *   cb({ result: args.n * 2 })
 * })
 */
export const createEmulator = <T extends MethodMap>() => {
  // biome-ignore lint/suspicious/noExplicitAny: emulator code
  const responders = new Map<keyof T, Set<StoredResponder<any, any>>>()

  // biome-ignore lint/suspicious/noExplicitAny: emulator code
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'reset') {
        return () => {
          for (const set of responders.values()) {
            set.clear()
          }
        }
      }

      if (prop === 'handle') {
        return async <M extends keyof T>(
          method: M,
          args: T[M]['args'],
          cb: ResponseCb<T[M]['resp']>
        ): Promise<void> => {
          const set = responders.get(method) ?? new Set()
          responders.set(method, set)
          return callResponder(method as string, set, args, cb)
        }
      }

      // Pass dispose and symbols through to the target
      if (prop === 'dispose' || typeof prop === 'symbol') {
        return Reflect.get(_target, prop)
      }

      // If it’s a method name
      if (typeof prop === 'string') {
        const method = prop as keyof T
        let set = responders.get(method)
        if (!set) {
          set = new Set()
          responders.set(method, set)
        }
        // biome-ignore lint/suspicious/noExplicitAny: emulator code
        return (filter?: Filter<any>) => makeRequest(set)(filter)
      }

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

/**
 * Adds disposable semantics to an object `T`.
 *
 * This augments any object with cleanup capabilities that can be invoked
 * explicitly via `.dispose()` or automatically using the `using` /
 * `await using` constructs available in Node.js 20+ and modern runtimes.
 *
 * - `.dispose()` → Manual cleanup, may be sync or async.
 * - `[Symbol.dispose]()` → Enables synchronous `using`.
 * - `[Symbol.asyncDispose]()` → Enables asynchronous `await using`.
 *
 * Useful for managing emulator lifetimes, open connections, or other
 * resources that must be cleaned up deterministically.
 *
 * @template T Base object type to be extended with disposal methods
 */
export type Disposable<T> = T & {
  /** Explicit synchronous or async disposal */
  dispose(): void | Promise<void>
  /** Symbol-based sync disposal for Node 20+ */
  [Symbol.dispose](): void
  /** Symbol-based async disposal for Node 20+ */
  [Symbol.asyncDispose]?(): Promise<void>
}

export const disposable = <T>(
  emulator: T,
  dispose: () => void | Promise<void>
): Disposable<T> => {
  const _disposable = emulator as Disposable<T>
  _disposable.dispose = dispose
  _disposable[Symbol.dispose] = dispose
  _disposable[Symbol.asyncDispose] = dispose as () => Promise<void>

  return _disposable
}
