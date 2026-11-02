import { describe, expectTypeOf, it } from 'vitest'
import { parse } from './prompt'
import type { CheckboxPrompt, InputPrompt, SelectPrompt } from './types'

describe('parse', () => {
  it('returns an input prompt when input is expected', () => {
    expectTypeOf(parse('', 'input')).toEqualTypeOf<InputPrompt>()
  })

  it('returns a select or checkbox prompt when select is expected, since a checkbox prompt is accepted', () => {
    expectTypeOf(parse('', 'select')).toEqualTypeOf<
      SelectPrompt | CheckboxPrompt
    >()
  })

  it('returns a checkbox prompt when checkbox is expected', () => {
    expectTypeOf(parse('', 'checkbox')).toEqualTypeOf<CheckboxPrompt>()
  })

  it('returns any of the prompts when no type is expected', () => {
    expectTypeOf(parse('')).toEqualTypeOf<
      InputPrompt | SelectPrompt | CheckboxPrompt
    >()
  })
})
