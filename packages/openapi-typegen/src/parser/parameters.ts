import type { ParameterObject } from '@sebspark/openapi-core'
import type { Parameter } from '../types.js'
import { parseDocumentation } from './common.js'
import { parseSchema } from './schema.js'

export const parseParameters = (
  schemas: Record<string, ParameterObject> = {}
): Parameter[] =>
  Object.entries(schemas || {}).map(([name, schema]) =>
    parseParameter(name, schema)
  )

export const parseParameter = (
  name: string | undefined,
  schema: ParameterObject
): Parameter => {
  const param: Parameter = {
    name,
    in: schema.in,
    parameterName: schema.name,
    optional: !schema.required,
    // biome-ignore lint/style/noNonNullAssertion: schema is always defined here
    type: parseSchema(undefined, schema.schema!),
    ...parseDocumentation(schema),
  }

  return param
}
