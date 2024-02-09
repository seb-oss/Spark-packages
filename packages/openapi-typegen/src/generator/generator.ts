import { ParsedComponents, ParsedOpenApiDocument } from '../types'
import { generateClient } from './client'
import { generateHeader, generateResponseBody, generateType } from './common'
import { generateServer } from './server'

export { generateType } from './common'
export { generateClient } from './client'
export { generateServer } from './server'

export const generate = (name: string, doc: ParsedOpenApiDocument): string => `
 /**
  * This file was auto-generated.
  * Do not make direct changes to the file.
  */
 
 import type {
   APIResponse,
   APIServerDefinition,
   BaseClient,
   GenericRouteHandler,
   PartiallySerialized,
   RequestOptions,
   Serialized,
 } from '@sebspark/openapi-core'
 import type { Request } from 'express'
 
 type Req = Pick<Request, 'url' | 'baseUrl' | 'cookies' | 'hostname'>
 
 /* tslint:disable */
 /* eslint-disable */
 
 ${generateComponents(doc.components)}

 ${generateServer(name, doc.paths)}

 ${generateClient(name, doc.paths)}

`

const generateComponents = (components: ParsedComponents): string => {
  const tokens: string[] = []

  for (const schema of components.schemas) {
    tokens.push(generateType(schema))
  }

  for (const header of components.headers) {
    tokens.push(generateHeader(header))
  }

  for (const param of components.parameters) {
    tokens.push(
      generateType({
        type: 'object',
        extends: [],
        name: param.name,
        properties: [
          {
            name: param.parameterName,
            type: [param.type],
            optional: param.optional,
          },
        ],
      })
    )
  }

  for (const req of components.requestBodies) {
    tokens.push(generateType(req))
  }

  for (const res of components.responseBodies) {
    tokens.push(generateResponseBody(res))
  }

  return tokens.join('\n\n')
}
