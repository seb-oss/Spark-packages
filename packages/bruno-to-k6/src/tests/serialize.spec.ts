import { describe, expect, it } from 'vitest'
import {
  escapeString,
  fileToImportName,
  jsonCoerceAndSerialize,
  jsonCoerceFields,
  jsonParse,
  jsonSerialize,
} from '../serialize'

describe('jsonSerialize', () => {
  describe('single-line', () => {
    it('serializes primitives', () => {
      expect(jsonSerialize(null)).toBe('null')
      expect(jsonSerialize(true)).toBe('true')
      expect(jsonSerialize(false)).toBe('false')
      expect(jsonSerialize(0)).toBe('0')
      expect(jsonSerialize(3.14)).toBe('3.14')
      expect(jsonSerialize('x')).toBe("'x'")
    })
    it('serializes arrays', () => {
      expect(jsonSerialize([1, 'a', true])).toBe("[1, 'a', true]")
      expect(jsonSerialize([])).toBe('[]')
      expect(jsonSerialize([['x'], { y: 2 }])).toBe("[['x'], {y: 2}]")
    })
    it('serializes objects with safe identifier keys unquoted', () => {
      expect(jsonSerialize({ foo: 'bar', depth2: { z: 1 } })).toBe(
        "{foo: 'bar', depth2: {z: 1}}"
      )
    })
    it('quotes keys that need quotation', () => {
      const obj = { 'needs-quotation': true, '123': 'numkey', 'k k': 1 }
      expect(jsonSerialize(obj)).toBe(
        "{'123': 'numkey', 'needs-quotation': true, 'k k': 1}"
      )
    })
    it('handles nested structures (example from prompt)', () => {
      const v = { foo: 'bar', 'needs-quotation': true, herp: { depth: 2 } }
      expect(jsonSerialize(v)).toBe(
        "{foo: 'bar', 'needs-quotation': true, herp: {depth: 2}}"
      )
    })
  })
  describe('multiline', () => {
    it('pretty-prints objects with 2-space indents', () => {
      const v = { a: 1, b: { c: 'x' }, d: true }
      expect(jsonSerialize(v, true)).toBe(
        `{
  a: 1,
  b: {
    c: 'x'
  },
  d: true
}`
      )
    })
    it('pretty-prints arrays with 2-space indents', () => {
      const v = [1, 'x', { k: 'v' }]
      expect(jsonSerialize(v, true)).toBe(
        `[
  1,
  'x',
  {
    k: 'v'
  }
]`
      )
    })
    it('indents multiline', () => {
      const v = { a: 1, b: { c: 'x' }, d: true }
      expect(jsonSerialize(v, 4)).toBe(
        `{
      a: 1,
      b: {
        c: 'x'
      },
      d: true
    }`
      )
    })
  })
})
describe('escapeString', () => {
  it('escapes single quotes, backslashes, and newlines', () => {
    const input = `O'Reilly \\ docs\nline2`
    const escaped = escapeString(input)

    expect(escaped).toBe(`O\\'Reilly \\\\ docs\\nline2`)

    // round-trip check (single-quoted literal)
    const roundTrip = eval(`'${escaped}'`)
    expect(roundTrip).toBe(input)
  })
  it('does not escape double quotes', () => {
    const input = `He said "hi"`
    const escaped = escapeString(input)
    expect(escaped).toBe(`He said "hi"`)

    const roundTrip = eval(`'${escaped}'`)
    expect(roundTrip).toBe(input)
  })
  it('returns empty string unchanged', () => {
    expect(escapeString('')).toBe('')
  })
  it('leaves normal characters intact', () => {
    expect(escapeString('hello world')).toBe('hello world')
  })
})
describe('jsonParse', () => {
  it('parses valid JSON strings to objects', () => {
    expect(jsonParse('{"a":1,"b":"x"}')).toEqual({ a: 1, b: 'x' })
    expect(jsonParse('[1,2,3]')).toEqual([1, 2, 3])
    expect(jsonParse('true')).toEqual(true)
    expect(jsonParse('null')).toEqual(null)
  })
  it('returns input unchanged when not valid JSON', () => {
    expect(jsonParse('not json')).toBe('not json')
    expect(jsonParse('{a:1}')).toBe('{a:1}')
    expect(jsonParse('{"unterminated"')).toBe('{"unterminated"')
  })
})
describe('jsonCoerceFields', () => {
  it('coerces stringified JSON values, leaves other types intact', () => {
    const input = {
      a: '1',
      b: '{"k":"v"}',
      c: '[1,2]',
      d: 'true',
      e: 'not json',
      f: 42,
      g: { nested: 'x' },
    }
    const out = jsonCoerceFields(input as Record<string, unknown>)
    expect(out).toEqual({
      a: '1', // not coerced (primitive string)
      b: { k: 'v' }, // parsed
      c: [1, 2], // parsed
      d: true, // parsed
      e: 'not json', // left as-is
      f: 42, // left as-is
      g: { nested: 'x' }, // left as-is
    })
  })
})
describe('jsonCoerceAndSerialize', () => {
  it('parses a JSON string then serializes using pretty rules', () => {
    // becomes {a: 1, b: {c: 'x'}}
    expect(jsonCoerceAndSerialize('{"a":1,"b":{"c":"x"}}')).toBe(
      "{a: 1, b: {c: 'x'}}"
    )
  })
  it('coerces object field values then serializes', () => {
    const input = {
      a: '1',
      b: '{"c":"x"}',
      zed_key: 'ok',
    }
    // after coerce: { a: '1', b: { c: 'x' }, zed_key: 'ok' }
    // then serialize with unquoted safe keys
    expect(jsonCoerceAndSerialize(input)).toBe(
      "{a: '1', b: {c: 'x'}, zed_key: 'ok'}"
    )
  })
  it('falls back to serializing original value when parsing fails', () => {
    // not valid JSON → serialize as a plain string
    expect(jsonCoerceAndSerialize('not json')).toBe("'not json'")
  })
})
describe('fileToImportName', () => {
  it('camelCases typical filenames and strips extensions', () => {
    expect(fileToImportName('simple-get.ts')).toBe('simpleGet')
    expect(fileToImportName('complex.name.test.js')).toBe('complexNameTest')
    expect(fileToImportName('alreadyGood')).toBe('alreadyGood')
  })
  it('ensures valid identifier start with underscore when needed', () => {
    expect(fileToImportName('123-start.ts')).toBe('_123Start')
    expect(fileToImportName('9.js')).toBe('_9')
  })
  it('preserves $ and _ where appropriate', () => {
    expect(fileToImportName('$dollar-file.ts')).toBe('$dollarFile')
    expect(fileToImportName('_underscore.file.ts')).toBe('_underscoreFile')
  })
  it('collapses non-identifier characters and trims', () => {
    expect(fileToImportName('weird file.name (v2).txt')).toBe('weirdFileNameV2')
    expect(fileToImportName('  spaced---out  ')).toBe('spacedOut')
  })
  it('returns "_" when nothing usable remains', () => {
    expect(fileToImportName('!!!!')).toBe('_')
    expect(fileToImportName('')).toBe('_')
  })
})
