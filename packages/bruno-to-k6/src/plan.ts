import { type IRRequest } from './ir'

/** Inputs required to build a plan for code generation. */
export interface BuildRunPlanInput {
  /** Bruno root directory (absolute). */
  root: string
  /** Parsed requests (IR) in discovery order. */
  requests: IRRequest[]
  /** Flat environment variables (optional). */
  env?: Record<string, string>
}

/**
 * Execution plan produced from collection + env.
 * Generators should depend on this stable shape rather than raw files.
 */
export interface RunPlan {
  /** Bruno root directory (absolute). */
  root: string
  /** Requests to execute/generate, already ordered. */
  requests: IRRequest[]
  /** Flat environment variables (optional). */
  env?: Record<string, string>
  /** Optional logical collection name or metadata (reserved for future). */
  meta?: Record<string, unknown>
}

/**
 * Build a RunPlan from parsed requests and env.
 * Any grouping/ordering/tagging decisions should be encoded here.
 */
export function buildRunPlan(input: BuildRunPlanInput): RunPlan {
  const { root, env } = input
  const withIndex = input.requests.map((req, idx) => ({ req, idx }))

  const anySeq = withIndex.some(x => x.req.seq != null)

  const ordered = anySeq
    ? withIndex.slice().sort(compareRequests).map(x => x.req)
    : input.requests.slice()

  return {
    root,
    env,
    requests: ordered,
  }
}

/**
 * Compare two request entries for ordering when building a run plan.
 *
 * Sorting rules (in priority order):
 * 1. Requests that explicitly define a `seq` value come before those that don’t.
 * 2. If both have a `seq`, the lower numeric `seq` comes first.
 * 3. If both have no `seq`, preserve the original discovery order (by comparing `idx`).
 * 4. If both have the same `seq`, tie-break by lexicographic comparison of `path`.
 * 5. If `seq` and `path` are equal (rare), fall back to original discovery order (`idx`).
 *
 * @param a First candidate request + its original index
 * @param b Second candidate request + its original index
 * @returns Negative if `a` should come before `b`, positive if after, zero if equal
 */
const compareRequests = (
  a: { req: IRRequest; idx: number },
  b: { req: IRRequest; idx: number }
): number => {
  const sa = a.req.seq
  const sb = b.req.seq
  const aHas = sa != null
  const bHas = sb != null

  // Rule 1: requests with an explicit seq go first
  if (aHas && !bHas) return -1
  if (!aHas && bHas) return 1

  // Rule 2: if both have seq numbers, sort numerically
  if (aHas && bHas) {
    const diff = (sa as number) - (sb as number)
    if (diff !== 0) return diff
  }

  // Rule 3/4: fall back to path lexicographic order if seqs equal or absent
  const pa = a.req.path || ''
  const pb = b.req.path || ''
  const lp = pa.localeCompare(pb)
  if (lp !== 0) return lp

  // Rule 5: final fallback → preserve original discovery order
  return a.idx - b.idx
}
