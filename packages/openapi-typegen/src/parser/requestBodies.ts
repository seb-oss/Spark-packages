import { RequestBodyObject } from '@sebspark/openapi-core'
import { TypeDefinition } from '../types'
import { parseSchema } from './schema'

export const parseRequestBodies = (requestBodies: Record<string, RequestBodyObject> = {}): TypeDefinition[] => {
  const definitions: TypeDefinition[] = []
  for (const [name, requestBody] of Object.entries(requestBodies)) {
    if (requestBody.content['application/json'].schema) {
      definitions.push(parseSchema(name, requestBody.content['application/json'].schema))
    }
  }
  return definitions
}
