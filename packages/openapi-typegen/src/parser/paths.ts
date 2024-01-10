import {
  ComponentsObject,
  OpenApiDocument,
  OperationObject,
  PathItemObject,
  ReferenceObject,
  ResponseObject,
  ResponsesObject,
  Verb,
} from '@sebspark/openapi-core'
import { EmptyType, Path, TypeDefinition } from '../types'
import { parseRef, parseDocumentation } from './common'
import { parseSchema } from './schema'
import { parseArgs } from './args'

export const parsePaths = (doc: OpenApiDocument): Path[] =>
  Object.entries(doc.paths || {}).flatMap(([name, path]) =>
    parsePath(name, path as PathItemObject, doc.components)
  )

export const parsePath = (
  url: string,
  path: PathItemObject,
  components?: ComponentsObject
): Path[] => {
  const paths: Path[] = []
  const methods: Verb[] = ['delete', 'get', 'patch', 'post', 'put']

  for (const method of methods) {
    if (path[method]) {
      paths.push(
        parseMethod(url, method, path[method] as OperationObject, components)
      )
    }
  }

  return paths
}

const parseMethod = (
  url: string,
  method: Verb,
  operation: OperationObject,
  components?: ComponentsObject
): Path => {
  return {
    method,
    url: parseUrl(url),
    responses: parseResponses(operation.responses),
    args: parseArgs(operation, components),
    ...parseDocumentation(operation),
  }
}

const parseUrl = (url: string): string => url.replace(/{([^}]+)}/g, ':$1')

const parseResponses = (
  responses: ResponsesObject
): Record<number, TypeDefinition> => {
  return Object.assign(
    {},
    ...Object.entries(responses).map(([code, response]) => {
      return {
        [parseInt(code, 10)]: parseResponse(response),
      } as Record<number, TypeDefinition>
    })
  )
}

const parseResponse = (
  response: ResponseObject | ReferenceObject
): TypeDefinition | EmptyType => {
  const ref = (response as ReferenceObject).$ref
  if (ref) return { type: parseRef(ref) }
  const schema = (response as ResponseObject).content?.['application/json']
    ?.schema
  return schema ? parseSchema(undefined, schema) : {type: undefined, ...parseDocumentation(response as ResponseObject)}
}
