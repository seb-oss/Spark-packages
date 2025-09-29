import type { HeaderObject } from '@sebspark/openapi-core'
import type { Header } from '../types'
import { parseDocumentation } from './common'
import { parseSchema } from './schema'

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
    // biome-ignore lint/style/noNonNullAssertion: here it is always defined
    type: parseSchema(undefined, schema.schema!),
    ...parseDocumentation(schema),
  }

  return header
}
