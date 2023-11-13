import { readFileSync } from 'fs'
import { generateOpenApi } from '../generator'
import prettier from 'prettier'
import { describe, it, expect } from 'vitest'
import { OpenAPI3 } from '../specification'

const format = (str: string) => {
  return prettier.format(str, {
    semi: false,
    parser: 'typescript',
    singleQuote: true,
  })
}

const schemaTxt = readFileSync(__dirname + '/components.json', 'utf8')
const schema: OpenAPI3 = JSON.parse(schemaTxt)
const typescript = readFileSync(__dirname + '/components.generated.ts', 'utf8')

describe.skip('components', () => {
  describe('generate', () => {
    it('generates a correct document', async () => {
      const generated = await generateOpenApi(schema)
      const expected = await format(typescript)
      expect(generated).toEqual(expected)
    })
  })
})
