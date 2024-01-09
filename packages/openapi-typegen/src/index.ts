import { OpenApiDocument } from '@sebspark/openapi-core'
import { parseDocument } from './parser'
import { generate, format } from './generator'

export const generateTypescript = async (name: string, doc: OpenApiDocument): Promise<string> => {
  const parsed = parseDocument(doc)
  const generated = generate(name, parsed)
  const formatted = await format(generated)

  return formatted
}
