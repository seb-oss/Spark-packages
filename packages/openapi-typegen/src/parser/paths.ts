import {
  ComponentsObject,
  OpenApiDocument,
  OperationObject,
  PathItemObject,
  ResponsesObject,
  Verb,
} from '@sebspark/openapi-core'
import { Path, TypeDefinition } from '../types'
import { parseArgs } from './args'
import { parseDocumentation, parseRef } from './common'
import { parseResponseBody } from './responseBodies'

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
        [parseInt(code, 10)]: parseResponseBody(undefined, response),
      } as Record<number, TypeDefinition>
    })
  )
}
