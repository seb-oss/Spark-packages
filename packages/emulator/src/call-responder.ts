import type { ResponseCb, StoredResponder } from './types'

/**
 * Dispatches a single request to the highest-priority matching responder.
 *
 * **LIFO ordering** — responders are considered in reverse insertion order,
 * so the most recently registered one wins. This lets tests temporarily
 * override a default with a more specific responder, then fall back once
 * it is consumed.
 *
 * **Filters** — a responder is only eligible if it has no filter, or its
 * filter returns `true` for the incoming `args`.
 *
 * **Lifetime** — before invoking the chosen responder, its `remaining`
 * count is decremented. If it reaches zero the responder is removed from
 * the set. Decrement happens *before* invocation so that concurrent or
 * subsequent requests see the updated count even for long-lived streaming
 * responders that only complete when the test calls `waitForCall()`.
 *
 * @throws {Error} When no matching responder is found.
 *
 * @template A Arguments type
 * @template R Response type
 */
export const callResponder = async <A, R>(
  methodName: string,
  responders: Set<StoredResponder<A, R>>,
  args: A,
  cb: ResponseCb<R>
): Promise<void> => {
  const [chosen] = [...responders]
    .reverse()
    .filter((r) => !r.filter || r.filter(args))

  if (!chosen) {
    throw new Error(
      `No responder found for .${methodName}(${args && JSON.stringify(args)})`
    )
  }

  if (chosen.remaining !== Number.POSITIVE_INFINITY) {
    chosen.remaining -= 1
    if (chosen.remaining <= 0) {
      responders.delete(chosen)
    }
  }

  await chosen.cb(args, cb)
}
