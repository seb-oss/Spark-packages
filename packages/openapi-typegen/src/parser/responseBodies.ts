import { HeaderObject, ReferenceObject, ResponseObject } from '@sebspark/openapi-core'
import { ResponseBody } from '../types'
import { parseSchema } from './schema'
import { parseRef, parseDocumentation } from './common'
import { parseHeader } from './headers'

export const parseResponseBodies = (responses: Record<string, ResponseObject | ReferenceObject> = {}): ResponseBody[] => {
  const bodies: ResponseBody[] = []

  for(const [name, b] of Object.entries(responses)) {
    const responseObject = b as ResponseObject
    const body: ResponseBody = {name, headers: []}
    if (responseObject.content?.['application/json']?.schema) {
      const schema = responseObject.content['application/json'].schema
      body.data = parseSchema(undefined, schema)
    }
    if (responseObject.headers) {
      for (const [headerName, header] of Object.entries(responseObject.headers)) {
        const ref = (header as ReferenceObject).$ref
        if (ref) body.headers.push({
          name: headerName,
          optional: false,
          type: {type: parseRef(ref)},
          ...parseDocumentation(header as HeaderObject),
        })
        else body.headers.push(parseHeader(headerName, header as HeaderObject))
      }
    }
    if (body.data || body.headers.length) bodies.push(body)
  }

  return bodies
}