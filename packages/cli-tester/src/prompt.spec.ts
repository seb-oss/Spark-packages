import { describe, expect, it } from 'vitest'
import { parse } from './prompt'

// A string that matches the parseSelect regex exactly
const SELECT_TEXT =
  '? choose one (Use arrow keys)\n❯ first option\n  second option\n'

describe('parse', () => {
  it('parses a select prompt when text matches parseSelect format', () => {
    const result = parse(SELECT_TEXT)
    expect(result.type).toBe('select')
    expect(result.message).toBe('choose one')
    expect(result.options).toContain('first option')
  })

  it('throws when expectedType does not match the parsed prompt type', () => {
    expect(() => parse(SELECT_TEXT, 'input')).toThrow(
      /Expected a input prompt but got/
    )
  })

  it('throws for completely unknown prompt format', () => {
    expect(() => parse('not a prompt')).toThrow(
      'Unknown prompt format "not a prompt"'
    )
  })

  it('does not throw when expectedType is select and prompt type is checkbox', () => {
    // checkbox prompt text — parseCheckbox matches first for this format
    const checkboxText = '? pick things\n❯◯ item a\n ◯ item b\n ◯ item c\n'
    const result = parse(checkboxText, 'select')
    expect(result.type).toBe('checkbox')
  })
})
