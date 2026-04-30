import type { ReplyInput, StreamResponder } from './types'

/**
 * Converts any user-supplied responder form into the canonical
 * `StreamResponder` — a function `(args, cb) => void | Promise<void>`.
 *
 * This lets the rest of the emulator treat all responders uniformly,
 * regardless of how they were registered:
 *
 * | Input form | Detected by | Behaviour |
 * |---|---|---|
 * | Static value `R` | `typeof input !== 'function'` | Wraps value in `cb(input)` |
 * | Single-response fn `(args) => R` | `fn.length < 2` | Calls fn, passes result to `cb` |
 * | Streaming fn `(args, cb) => void` | `fn.length >= 2` | Used as-is |
 *
 * @template A Arguments type
 * @template R Response type
 */
export const normalizeResponder = <A, R>(
  input: ReplyInput<A, R>
): StreamResponder<A, R> => {
  if (typeof input !== 'function') {
    return async (_args, cb) => {
      await cb(input)
    }
  }

  if (input.length >= 2) {
    // Already a streaming responder: (args, cb) => void
    return input as StreamResponder<A, R>
  }

  // Single-response function: (args) => R | Promise<R>
  return async (args, cb) => {
    const result = await (input as (args: A) => R | Promise<R>)(args)
    await cb(result)
  }
}
