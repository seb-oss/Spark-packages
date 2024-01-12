import {
  HeaderObject,
  ReferenceObject,
  ResponseObject,
} from '@sebspark/openapi-core'
import { CustomType, ResponseBody } from '../types'
import { parseSchema } from './schema'
import { parseRef, parseDocumentation } from './common'
import { parseHeader } from './headers'

export const parseResponseBodies = (
  responses: Record<string, ResponseObject | ReferenceObject> = {}
): ResponseBody[] => {
  const bodies: ResponseBody[] = []

  for (const [name, b] of Object.entries(responses)) {
    const body = parseResponseBody(name, b)
    bodies.push(body)
  }

  return bodies
}

export const parseResponseBody = (name: string | undefined, response: ResponseObject | ReferenceObject): ResponseBody | CustomType => {
  const ref = (response as ReferenceObject).$ref
  if (ref) return { type: parseRef(ref) }
  
  const responseObject = response as ResponseObject
  const body: ResponseBody = {}
  if (name) body.name = name
  if (responseObject.description) body.description = responseObject.description

  if (responseObject.content?.['application/json']?.schema) {
    const schema = responseObject.content['application/json'].schema
    body.data = parseSchema(undefined, schema)
  }
  if (responseObject.headers) {
    body.headers = []
    for (const [headerName, header] of Object.entries(
      responseObject.headers
    )) {
      const ref = (header as ReferenceObject).$ref
      if (ref)
        body.headers.push({
          name: headerName,
          optional: false,
          type: { type: parseRef(ref) },
          ...parseDocumentation(header as HeaderObject),
        })
      else body.headers.push(parseHeader(headerName, header as HeaderObject))
    }
  }
  return body
}
