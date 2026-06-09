import type { IPersistor } from '@sebspark/memredis'
import { IdempotencyConflictError, IdempotencyEndError } from './errors'

/**
 * Guards an async operation against duplicate execution.
 *
 * When created, the guard checks Redis for an existing result (a previous
 * completed run) and subscribes to a pub/sub channel to detect concurrent
 * runs. If either is detected, `run()` rejects with `IdempotencyConflictError`.
 *
 * @template R - Return type of the function passed to `run()`.
 * @template V - Type of the value passed to `end()` and stored in Redis.
 *               Defaults to `R`.
 *
 * @example
 * const guard = await IdempotencyGuard.create<Order, string>(key, client)
 * try {
 *   const order = await guard.run(async (end) => {
 *     const result = await createOrder(body)
 *     end(result.id)
 *     return result
 *   })
 *   return res.status(201).location(`/orders/${order.id}`).send()
 * } catch (err) {
 *   if (err instanceof IdempotencyConflictError) {
 *     return res.status(200).location(`/orders/${err.value}`).send()
 *   }
 *   throw err
 * }
 */
export class IdempotencyGuard<R, V = R> {
  /**
   * Standard `AbortSignal` that fires when a conflict is detected.
   * Pass to outgoing requests (e.g. `fetch`) to cancel them on abort.
   */
  readonly signal: AbortSignal

  private readonly key: string
  private readonly client: IPersistor
  private readonly controller: AbortController
  private conflict: { value: V } | undefined = undefined
  private subscriptionListener:
    | ((message: string, channel: string) => unknown)
    | undefined = undefined

  private constructor(key: string, client: IPersistor) {
    this.key = key
    this.client = client
    this.controller = new AbortController()
    this.signal = this.controller.signal
  }

  /**
   * Creates an idempotency guard for the given key.
   *
   * Checks Redis for an existing result and subscribes to the pub/sub channel
   * for the key. If a result already exists, the guard is immediately aborted.
   *
   * @param key - The idempotency key. Must be unique per logical operation.
   * @param client - A Redis client implementing `IPersistor`.
   * @returns A guard ready to be passed to `run()`.
   */
  static async create<R, V = R>(
    key: string,
    client: IPersistor
  ): Promise<IdempotencyGuard<R, V>> {
    const guard = new IdempotencyGuard<R, V>(key, client)

    const existing = await client.get(key)
    if (existing !== null) {
      guard.conflict = { value: JSON.parse(existing) as V }
      guard.controller.abort()
      return guard
    }

    const listener = (message: string) => {
      guard.conflict = { value: JSON.parse(message) as V }
      guard.controller.abort()
    }
    guard.subscriptionListener = listener
    await client.subscribe(key, listener)

    return guard
  }

  /**
   * Runs the guarded function, racing it against the abort signal.
   *
   * The function receives an `end` callback as its first argument. `end(value)`
   * must be called exactly once before the function returns — it stores the
   * committed value in Redis and notifies any concurrent guards.
   *
   * `end()` is fire-and-forget. The write to Redis happens asynchronously;
   * there is no need to `await` it.
   *
   * If the abort signal fires while the function is suspended at an `await`,
   * `run()` rejects immediately with `IdempotencyConflictError`. The function
   * continues running in the background but its result is discarded.
   *
   * @param fn - The guarded async function. Receives `end` as its first argument.
   * @returns The return value of `fn`.
   *
   * @throws {IdempotencyConflictError} When a duplicate is detected — either
   *   because the key already existed or a concurrent guard called `end()` first.
   *   `err.value` is the committed value from the winning process.
   * @throws {IdempotencyEndError} When `fn` returns without calling
   *   `end()`, or when `end()` is called more than once.
   */
  async run(fn: (end: (value: V) => void) => Promise<R>): Promise<R> {
    if (this.signal.aborted && this.conflict) {
      throw new IdempotencyConflictError(this.conflict.value)
    }

    return new Promise<R>((resolve, reject) => {
      let ended = false

      const end = (value: V): void => {
        if (ended) {
          reject(new IdempotencyEndError('end() was called more than once'))
          return
        }
        ended = true
        const serialized = JSON.stringify(value)
        this.client
          .set(this.key, serialized)
          .then(() =>
            this.client.unsubscribe(this.key, this.subscriptionListener)
          )
          .then(() => this.client.publish(this.key, serialized))
          .catch(reject)
      }

      const onAbort = () => {
        if (this.conflict) {
          reject(new IdempotencyConflictError(this.conflict.value))
        }
      }

      this.signal.addEventListener('abort', onAbort, { once: true })

      fn(end)
        .then((result) => {
          this.signal.removeEventListener('abort', onAbort)
          if (ended) {
            resolve(result)
          } else {
            reject(
              new IdempotencyEndError(
                'end() was not called before the function returned'
              )
            )
          }
        })
        .catch((err: unknown) => {
          this.signal.removeEventListener('abort', onAbort)
          reject(err)
        })
    })
  }
}
