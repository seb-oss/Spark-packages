import type { ReplyInput, StreamResponder } from './types'

const isStreamResponder = <A, R>(
  input: ReplyInput<A, R>
): input is StreamResponder<A, R> =>
  typeof input === 'function' && input.length >= 2

const isSingleResponder = <A, R>(
  input: ReplyInput<A, R>
): input is (args: A) => R | Promise<R> =>
  typeof input === 'function' && input.length < 2

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
  if (isStreamResponder(input)) {
    // Already a streaming responder: (args, cb) => void
    return input
  }

  if (isSingleResponder(input)) {
    // Single-response function: (args) => R | Promise<R>
    return async (args, cb) => {
      await cb(await input(args))
    }
  }

  return async (_args, cb) => {
    await cb(input)
  }
}
