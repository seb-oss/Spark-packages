import type { RequestBodyObject } from '@sebspark/openapi-core'
import type { TypeDefinition } from '../types'
import { parseSchema } from './schema'

export const parseRequestBodies = (
  requestBodies: Record<string, RequestBodyObject> = {}
): TypeDefinition[] => {
  const definitions: TypeDefinition[] = []
  for (const [name, requestBody] of Object.entries(requestBodies)) {
    const schema = requestBody.content['application/json']?.schema
    if (schema) definitions.push(parseSchema(name, schema))
  }
  return definitions
}
