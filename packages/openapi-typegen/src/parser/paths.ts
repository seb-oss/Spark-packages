import type {
  ComponentsObject,
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  ResponsesObject,
  Verb,
} from '@sebspark/openapi-core'
import type { Path, TypeDefinition } from '../types'
import { parseArgs } from './args'
import { findRef, parseDocumentation } from './common'
import { parseResponseBody } from './responseBodies'

export const parsePaths = (doc: OpenApiDocument): Path[] =>
  Object.entries(/* istanbul ignore next */ doc.paths || {}).flatMap(
    ([name, path]) => parsePath(name, path as PathItemObject, doc.components)
  )

export const parsePath = (
  url: string,
  path: PathItemObject,
  components?: ComponentsObject
): Path[] => {
  const paths: Path[] = []
  const methods: Verb[] = ['delete', 'get', 'patch', 'post', 'put']

  for (const method of methods) {
    const operation = path[method]
    if (operation) {
      const merged: OperationObject = {
        ...operation,
        parameters: mergeParameters(
          path.parameters,
          operation.parameters,
          components
        ),
      }
      paths.push(parseMethod(url, method, merged, components))
    }
  }

  return paths
}

/**
 * Merges path-level parameters into an operation's parameters, as OpenAPI 3
 * specifies. An operation parameter with the same `name` and `in` overrides
 * the path-level one. `#/components/headers` refs are never treated as
 * overrides and are always kept.
 */
const mergeParameters = (
  pathParams: (ParameterObject | ReferenceObject)[] = [],
  operationParams: (ParameterObject | ReferenceObject)[] = [],
  components: ComponentsObject = {}
): (ParameterObject | ReferenceObject)[] => {
  const operationKeys = new Set(
    operationParams.map((p) => resolveParameterKey(components, p))
  )
  return [
    ...pathParams.filter((p) => {
      const k = resolveParameterKey(components, p)
      return k === undefined || !operationKeys.has(k)
    }),
    ...operationParams,
  ]
}

/**
 * Returns a unique key for a parameter based on its `in` and `name` values.
 * If the parameter is a `$ref` to a component, it resolves the reference first.
 * Returns `undefined` for `$ref`s that are not in `#/components/parameters/`.
 */
const resolveParameterKey = (
  components: ComponentsObject,
  params: ParameterObject | ReferenceObject
): string | undefined => {
  if (!('$ref' in params)) return `${params.in}:${params.name}`
  if (!params.$ref.startsWith('#/components/parameters/')) return undefined
  const resolved = findRef<ParameterObject>(components, params.$ref)
  return `${resolved.in}:${resolved.name}`
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
        [Number.parseInt(code, 10)]: parseResponseBody(undefined, response),
      } as Record<number, TypeDefinition>
    })
  )
}
