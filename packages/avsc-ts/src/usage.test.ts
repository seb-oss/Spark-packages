import { stripVTControlCharacters } from 'node:util'
import { describe, expect, it } from 'vitest'
import { usage } from './usage'

describe('usage', () => {
  it('shows the command line without leftover string concatenation', () => {
    const text = stripVTControlCharacters(usage)

    expect(text).toContain(
      'Usage: avsc-ts --input ./schemas --output ./dist \n'
    )
    expect(text).not.toContain("' +")
  })
})
