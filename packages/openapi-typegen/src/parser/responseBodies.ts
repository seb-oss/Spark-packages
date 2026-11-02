import type { ReferenceObject, ResponseObject } from '@sebspark/openapi-core'
import { isReference } from '../typeGuards'
import type { CustomType, ResponseBody } from '../types'
import { parseDocumentation, parseRef } from './common'
import { parseHeader } from './headers'
import { parseSchema } from './schema'

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

export const parseResponseBody = (
  name: string | undefined,
  response: ResponseObject | ReferenceObject
): ResponseBody | CustomType => {
  if (isReference(response)) return { type: parseRef(response.$ref) }

  const responseObject = response
  const body: ResponseBody = {}
  if (name) body.name = name
  /* istanbul ignore else */
  if (responseObject.description) body.description = responseObject.description

  if (responseObject.content?.['application/json']?.schema) {
    const schema = responseObject.content['application/json'].schema
    body.data = parseSchema(undefined, schema)
  }
  if (responseObject.headers) {
    body.headers = []
    for (const [headerName, header] of Object.entries(responseObject.headers)) {
      if (isReference(header))
        body.headers.push({
          name: headerName,
          optional: false,
          type: { type: parseRef(header.$ref) },
          ...parseDocumentation(header),
        })
      else body.headers.push(parseHeader(headerName, header))
    }
  }
  return body
}
