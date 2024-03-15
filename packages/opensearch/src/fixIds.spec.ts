import { describe, expect, test } from 'vitest'
import { clean } from './fixIds'

describe('#clean', () => {
  test('empty object returns empty object', () => {
    expect(clean({})).toEqual({})
  })

  test('removes undefined values', () => {
    expect(clean({ a: 1, b: undefined, c: null })).toEqual({ a: 1, c: null })
  })

  test('handles array', () => {
    expect(clean({ a: 1, b: ['test', undefined] })).toEqual({
      a: 1,
      b: ['test'],
    })
  })

  test('handles nested object', () => {
    expect(clean({ a: 1, b: { c: 2, d: undefined } })).toEqual({
      a: 1,
      b: { c: 2 },
    })
  })

  test('handles nested array', () => {
    expect(clean({ a: 1, b: [{ c: 2, d: undefined }] })).toEqual({
      a: 1,
      b: [{ c: 2 }],
    })
  })

  test('handles nested array of objects', () => {
    expect(
      clean({
        a: 1,
        b: {
          c: [
            { c: 2, d: undefined },
            { e: 3, f: null },
          ],
        },
      })
    ).toEqual({
      a: 1,
      b: {
        c: [{ c: 2 }, { e: 3, f: null }],
      },
    })
  })
})
