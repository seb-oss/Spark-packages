import { ParameterObject } from '@sebspark/openapi-core'
import { Parameter } from '../types'
import { parseDocumentation } from './common'
import { parseSchema } from './schema'

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
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    type: parseSchema(undefined, schema.schema!),
    ...parseDocumentation(schema),
  }

  return param
}
