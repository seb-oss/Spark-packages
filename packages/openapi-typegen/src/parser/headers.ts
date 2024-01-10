import { HeaderObject } from '@sebspark/openapi-core'
import { Header } from '../types'
import { parseSchema } from './schema'
import { parseDocumentation } from './common'

export const parseHeaders = (
  schemas: Record<string, HeaderObject> = {}
): Header[] =>
  Object.entries(schemas || {}).map(([name, schema]) =>
    parseHeader(name, schema)
  )

export const parseHeader = (name: string, schema: HeaderObject): Header => {
  const header: Header = {
    name,
    optional: !schema.required,
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    type: parseSchema(undefined, schema.schema!),
    ...parseDocumentation(schema),
  }

  return header
}
