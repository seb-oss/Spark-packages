/**
 * A filter function that decides whether a responder should handle a given
 * request. When registered, a responder with a filter is only eligible if
 * the filter returns `true` for the incoming args.
 *
 * @template A Arguments type for the request
 */
export type Filter<A> = (args: A) => boolean

/**
 * Callback invoked by a responder to deliver one response to the transport
 * layer. Simple responders call it once; streaming responders may call it
 * many times.
 *
 * @template R Response type
 */
export type ResponseCb<R> = (resp: R) => unknown

/**
 * The canonical internal form for every responder. All user-facing forms
 * (static value, single-response function, streaming function) are
 * normalised into this shape before being stored.
 *
 * @template A Arguments type
 * @template R Response type
 */
export type StreamResponder<A, R> = (
  args: A,
  cb: ResponseCb<R>
) => void | Promise<void>

/**
 * The three user-facing forms accepted by `.reply()` and `.callback()`.
 *
 * 1. **Static value** — `R` — returned as-is for every call.
 * 2. **Single-response function** — `(args) => R | Promise<R>` — called once
 *    per request to compute the response.
 * 3. **Streaming function** — `(args, cb) => void` — may call `cb` any
 *    number of times to emit multiple responses.
 *
 * @template A Arguments type
 * @template R Response type
 */
export type ReplyInput<A, R> =
  | R
  | ((args: A) => R | Promise<R>)
  | StreamResponder<A, R>

/**
 * A registered responder as stored in the emulator's internal set.
 *
 * `remaining` tracks how many more times this responder may be invoked:
 * - `Infinity` — unlimited (`.persist()`)
 * - `n` — valid for exactly `n` more calls
 *
 * @template A Arguments type
 * @template R Response type
 */
export interface StoredResponder<A, R> {
  filter?: Filter<A>
  cb: StreamResponder<A, R>
  remaining: number
}

/**
 * A handle returned by `.stream()` that lets a test drive a stateful,
 * externally-controlled streaming responder one response at a time.
 *
 * Typical usage in a test:
 * ```ts
 * const stream = emu.chat().stream(() => ({ token: 'Hello', done: false }))
 *
 * client.chat({ message: 'hi' }, onToken)
 *
 * await stream.waitForCall()          // blocks until the request arrives
 * await stream.send(() => ({ token: 'World', done: true }))
 * ```
 *
 * - `waitForCall(timeoutMs?)` — resolves when the next request has arrived
 *   and the initializer has been called. Rejects after `timeoutMs` ms
 *   (default `5000`) if no request arrives.
 * - `send(modifier)` — derives the next response from `latestResponse` and
 *   pushes it to the transport. Throws if called before `waitForCall()`.
 * - `latestResponse` — the most recent response sent, or `undefined` before
 *   the first `waitForCall()` resolves.
 * - `hasBeenCalled` — `true` once the first `waitForCall()` has resolved.
 *
 * @template R Response type
 */
export interface StreamHandle<R> {
  waitForCall(timeoutMs?: number): Promise<void>
  send(modifier: (prev: R) => R): Promise<void>
  readonly latestResponse: R | undefined
  readonly hasBeenCalled: boolean
}

/**
 * The builder returned by `.times(n)` or `.persist()` that exposes the
 * same responder registration methods as {@link MethodCall} but without
 * the lifetime-configuration methods (those have already been applied).
 *
 * @template A Arguments type
 * @template R Response type
 */
export interface MethodCallBuilder<A, R> {
  reply(response: R): { execute(arg: A): Promise<R> }
  reply(fn: (args: A) => R | Promise<R>): { execute(arg: A): Promise<R> }

  callback(fn: (args: A, cb: (resp: R) => unknown) => unknown): {
    execute(arg: A, cb: (resp: R) => unknown): Promise<void>
  }

  stream(initializer: (args: A) => R): StreamHandle<R>
}

/**
 * The full registration API exposed for a single emulator method.
 *
 * Default behaviour (without a lifetime modifier) registers a **one-shot**
 * responder. Chain `.times(n)`, `.persist()`, `.once()`, `.twice()`, or
 * `.thrice()` to change that.
 *
 * @template A Arguments type
 * @template R Response type
 */
export interface MethodCall<A, R> {
  reply(response: R): { execute(arg: A): Promise<R> }
  reply(fn: (args: A) => R | Promise<R>): { execute(arg: A): Promise<R> }

  callback(fn: (args: A, cb: (resp: R) => unknown) => unknown): {
    execute(arg: A, cb: (resp: R) => unknown): Promise<void>
  }

  stream(initializer: (args: A) => R): StreamHandle<R>

  times(n: number): MethodCallBuilder<A, R>
  persist(): MethodCallBuilder<A, R>
  once(): MethodCallBuilder<A, R>
  twice(): MethodCallBuilder<A, R>
  thrice(): MethodCallBuilder<A, R>

  /** Number of responders registered for this method that are not yet consumed. */
  readonly pending: number

  /** Remove all registered responders for this method. */
  reset(): void
}

/**
 * Describes every method that an emulator instance understands.
 *
 * Each key maps a method name to its request (`args`) and response (`resp`)
 * types. Only used at the type level — no runtime value is required.
 *
 * @example
 * type PaymentMethodMap = {
 *   authorise: { args: { amount: number }; resp: { authCode: string } }
 *   refund:    { args: { authCode: string }; resp: { success: boolean } }
 * }
 */
// biome-ignore lint/suspicious/noExplicitAny: MethodMap is a type-level utility
export type MethodMap = Record<string, { args: any; resp: any }>

/**
 * Adds explicit and symbol-based disposal to any object.
 *
 * Supports manual `.dispose()`, synchronous `using` (Node 20+), and
 * asynchronous `await using` (Node 20+).
 *
 * @template T The base object type to extend.
 */
export type Disposable<T> = T & {
  dispose(): void | Promise<void>
  [Symbol.dispose](): void
  [Symbol.asyncDispose]?(): Promise<void>
}
