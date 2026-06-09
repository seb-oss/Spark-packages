/**
 * Thrown when a duplicate operation is detected — either because the key
 * already exists in Redis (a previous run completed) or because a concurrent
 * guard called `end()` first.
 *
 * @template V - The type of the value committed by the winning process.
 */
export class IdempotencyConflictError<V> extends Error {
  /** The value passed to `end()` by the winning process. */
  readonly value: V

  constructor(value: V) {
    super('IdempotencyConflictError: duplicate operation detected')
    this.value = value
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Thrown when the function passed to `run()` returns without calling `end()`,
 * or when `end()` is called more than once.
 */
export class IdempotencyEndError extends Error {
  constructor(message: string) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
