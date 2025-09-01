// src/plan.spec.ts
import { describe, it, expect } from 'vitest'
import { buildRunPlan } from '../plan'
import type { IRRequest } from '../ir'

const mk = (over: Partial<IRRequest>): IRRequest => ({
  name: 'req',
  path: '/abs/any.bru',
  method: 'GET',
  url: 'https://example.test',
  params: {},
  headers: [],
  tests: [],
  ...over,
})

describe('buildRunPlan', () => {
  it('returns a copy of requests when no seq is present (no sorting branch)', () => {
    const a = mk({ name: 'a', path: '/abs/a.bru' })
    const b = mk({ name: 'b', path: '/abs/b.bru' })
    const input = { root: '/abs/root', requests: [a, b] }

    const plan = buildRunPlan(input)

    // preserves original order and creates a new array
    expect(plan.requests.map(r => r.name)).toEqual(['a', 'b'])
    expect(plan.requests).not.toBe(input.requests)
  })
  it('places requests with seq before those without (aHas && !bHas)', () => {
    const withSeq = mk({ name: 'with', path: '/abs/with.bru', seq: 1 })
    const noSeq   = mk({ name: 'none', path: '/abs/none.bru' })
    const plan = buildRunPlan({ root: '/abs/root', requests: [noSeq, withSeq] })

    expect(plan.requests.map(r => r.name)).toEqual(['with', 'none'])
  })
  it('places requests without seq after those with ( !aHas && bHas )', () => {
    const noSeq   = mk({ name: 'none', path: '/abs/none.bru' })
    const withSeq = mk({ name: 'with', path: '/abs/with.bru', seq: 2 })
    const plan = buildRunPlan({ root: '/abs/root', requests: [withSeq, noSeq] })

    expect(plan.requests.map(r => r.name)).toEqual(['with', 'none'])
  })
  it('orders by seq ascending when both have seq (numeric compare)', () => {
    const r2 = mk({ name: 'two',   path: '/abs/two.bru',   seq: 2 })
    const r1 = mk({ name: 'one',   path: '/abs/one.bru',   seq: 1 })
    const r5 = mk({ name: 'five',  path: '/abs/five.bru',  seq: 5 })
    const plan = buildRunPlan({ root: '/abs/root', requests: [r2, r5, r1] })

    expect(plan.requests.map(r => r.name)).toEqual(['one', 'two', 'five'])
  })
  it('breaks seq ties lexicographically by path', () => {
    const za = mk({ name: 'za', path: '/abs/za.bru', seq: 3 })
    const ma = mk({ name: 'ma', path: '/abs/ma.bru', seq: 3 })
    const aa = mk({ name: 'aa', path: '/abs/aa.bru', seq: 3 })

    const plan = buildRunPlan({ root: '/abs/root', requests: [za, ma, aa] })

    expect(plan.requests.map(r => r.path)).toEqual([
      '/abs/aa.bru',
      '/abs/ma.bru',
      '/abs/za.bru',
    ])
  })
  it('final fallback: when seq and path are identical, preserve original discovery order (idx)', () => {
    // same seq and same path; only idx can break the tie
    const first  = mk({ name: 'first',  path: '/abs/same.bru', seq: 7 })
    const second = mk({ name: 'second', path: '/abs/same.bru', seq: 7 })

    // reverse input order to ensure comparator falls back to idx
    const plan = buildRunPlan({ root: '/abs/root', requests: [second, first] })

    expect(plan.requests.map(r => r.name)).toEqual(['second', 'first'])
  })
  it('when neither has seq: preserves original discovery order (including equal paths)', () => {
    const b = mk({ name: 'b', path: '/abs/b.bru' })
    const a = mk({ name: 'a', path: '/abs/a.bru' })
    const same2 = mk({ name: 'same2', path: '/abs/same.bru' })
    const same1 = mk({ name: 'same1', path: '/abs/same.bru' })

    // No seq anywhere → buildRunPlan should not sort; discovery order is kept
    const plan = buildRunPlan({ root: '/abs/root', requests: [b, same2, same1, a] })

    expect(plan.requests.map(r => r.name)).toEqual(['b', 'same2', 'same1', 'a'])
  })
  it('triggers sorting branch when at least one request has seq (aHas && !bHas)', () => {
    const a = mk({ name: 'with', path: '/abs/with.bru', seq: 1 })
    const b = mk({ name: 'none', path: '/abs/none.bru' })
    const input = { root: '/abs/root', requests: [b, a] }

    const plan = buildRunPlan(input)

    // Sorting happened (new array and order changed)
    expect(plan.requests).not.toBe(input.requests)
    expect(plan.requests.map(r => r.name)).toEqual(['with', 'none'])
  })
  it('covers numeric seq comparison (both have seq, different numbers)', () => {
    const r3 = mk({ name: 'three', path: '/abs/3.bru', seq: 3 })
    const r1 = mk({ name: 'one',   path: '/abs/1.bru', seq: 1 })
    const r2 = mk({ name: 'two',   path: '/abs/2.bru', seq: 2 })
    const plan = buildRunPlan({ root: '/abs/root', requests: [r3, r1, r2] })

    expect(plan.requests.map(r => r.name)).toEqual(['one', 'two', 'three'])
  })
  it('covers tie-breakers: same seq -> path -> original idx', () => {
    // same seq for all; ensures we hit path compare
    const z = mk({ name: 'z', path: '/abs/z.bru', seq: 5 })
    const a = mk({ name: 'a', path: '/abs/a.bru', seq: 5 })
    const dup1 = mk({ name: 'dup1', path: '/abs/same.bru', seq: 5 })
    const dup2 = mk({ name: 'dup2', path: '/abs/same.bru', seq: 5 })

    const plan = buildRunPlan({ root: '/abs/root', requests: [z, dup2, a, dup1] })

    // path tie-breaker puts /abs/a.bru first, then /abs/same.bru pair in original order,
    // then /abs/z.bru last
    expect(plan.requests.map(r => r.name)).toEqual(['a', 'dup2', 'dup1', 'z'])
  })
})
