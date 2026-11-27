import { describe, expect, it } from 'vitest'
import { decodeChange, encodeChanges } from './payload'

// Postgres rejects notification payloads of 8000 bytes or more. encodeChanges
// splits a change into payloads that each fit; decodeChange reads one back.

type Row = { user_id: string; note: string }

const bytes = (payload: string) => Buffer.byteLength(payload, 'utf8')

describe('encodeChanges', () => {
  it('sends a small change in one notification', () => {
    const payloads = encodeChanges<Row, 'user_id'>(
      { rows: [{ user_id: 'anna', note: '' }], deleted: ['bob'] },
      'user_id'
    )

    expect(payloads.map((payload) => decodeChange(payload))).toEqual([
      { rows: [{ user_id: 'anna', note: '' }], keys: [], deleted: ['bob'] },
    ])
  })

  it('sends nothing when nothing changed', () => {
    const payloads = encodeChanges<Row, 'user_id'>(
      { rows: [], deleted: [] },
      'user_id'
    )

    expect(payloads).toEqual([])
  })

  it('splits rows across notifications that each stay under the limit', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      user_id: `user-${i}`,
      note: 'x'.repeat(200),
    }))

    const payloads = encodeChanges<Row, 'user_id'>(
      { rows, deleted: [] },
      'user_id',
      8000
    )

    expect(payloads.length).toBeGreaterThan(1)
    for (const payload of payloads) expect(bytes(payload)).toBeLessThan(8000)
    const decoded = payloads.map((payload) =>
      decodeChange<Row, string>(payload)
    )
    expect(decoded.flatMap((change) => change.rows)).toEqual(rows)
  })

  it('splits deleted keys across notifications that each stay under the limit', () => {
    const deleted = Array.from(
      { length: 500 },
      (_, i) => `user-${String(i).padStart(40, '0')}`
    )

    const payloads = encodeChanges<Row, 'user_id'>(
      { rows: [], deleted },
      'user_id',
      8000
    )

    for (const payload of payloads) expect(bytes(payload)).toBeLessThan(8000)
    const decoded = payloads.map((payload) =>
      decodeChange<Row, string>(payload)
    )
    expect(decoded.flatMap((change) => change.deleted)).toEqual(deleted)
  })

  it('sends a row too big for a notification as its key, for the listener to read', () => {
    const huge = { user_id: 'anna', note: 'x'.repeat(10_000) }
    const small = { user_id: 'bob', note: '' }

    const payloads = encodeChanges<Row, 'user_id'>(
      { rows: [huge, small], deleted: [] },
      'user_id',
      8000
    )

    expect(payloads.map((payload) => decodeChange(payload))).toEqual([
      { rows: [small], keys: ['anna'], deleted: [] },
    ])
  })

  it('measures the limit in bytes, not characters', () => {
    const rows = Array.from({ length: 50 }, (_, i) => ({
      user_id: `user-${i}`,
      note: 'å'.repeat(200), // two bytes per character
    }))

    const payloads = encodeChanges<Row, 'user_id'>(
      { rows, deleted: [] },
      'user_id',
      8000
    )

    for (const payload of payloads) expect(bytes(payload)).toBeLessThan(8000)
    const decoded = payloads.map((payload) =>
      decodeChange<Row, string>(payload)
    )
    expect(decoded.flatMap((change) => change.rows)).toEqual(rows)
  })
})
