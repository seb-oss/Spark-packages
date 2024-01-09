import { OpenApiDocument } from '@sebspark/openapi-core'
import { readFileSync } from 'fs'
import prettier from 'prettier'
import { describe, expect, it } from 'vitest'

const format = (str: string) => {
  return prettier.format(str, {
    semi: false,
    parser: 'typescript',
    singleQuote: true,
  })
}

const schemaTxt = readFileSync(`${__dirname}/components.json`, 'utf8')
const schema: OpenApiDocument = JSON.parse(schemaTxt)
const typescript = readFileSync(
  `${__dirname}/components-avsc.generated.ts`,
  'utf8'
)

// TODO: Add support for requestBody
describe.skip('components', () => {
  describe('generate', () => {
    it('generates a correct document', async () => {})
  })
})
