import type { ParameterObject, ReferenceObject, SchemaObject } from './common'
import type {
  OpenApiDocument,
  OperationObject,
  PathItemObject,
} from './openapi'
import type { APIServerDefinition } from './types'

const clone = <T>(orig: T): T => JSON.parse(JSON.stringify(orig))

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const

const operationsOf = (
  item: PathItemObject | ReferenceObject
): OperationObject[] =>
  '$ref' in item ? [] : METHODS.flatMap((method) => item[method] ?? [])

/**
 * Marks unimplemented paths as deprecated and tags them with 'not-implemented'.
 * Use to hide or visually separate endpoints not yet available on the given server.
 *
 * @param document - The OpenAPI document to modify
 * @param server - The server definition to check against for implemented paths
 * @returns A cloned document with unimplemented paths marked as deprecated
 */
export const disableUnimplementedPaths = <
  T extends OpenApiDocument,
  S extends APIServerDefinition,
>(
  document: T,
  server: S
): T => {
  const doc = clone(document)
  for (const [path, pathItem] of Object.entries(doc.paths)) {
    const fixedPath = path.replace(/{(.+)}/, ':$1')
    if (!server[fixedPath] && !fixedPath.startsWith('/health')) {
      for (const operation of operationsOf(pathItem)) {
        operation.deprecated = true
        operation.tags = [...(operation.tags ?? []), 'not-implemented']
      }
    }
  }
  return doc
}

/**
 * Appends the API version segment to all server URLs.
 *
 * @param document - The OpenAPI document to modify
 * @param version - The version string to append
 * @returns A cloned document with updated server URLs
 */
export const appendVersionToServers = <T extends OpenApiDocument>(
  document: T,
  version: string
): T => {
  const doc = clone(document)
  for (const server of doc.servers || []) {
    server.url = `${server.url}/${version}`
  }
  return doc
}

/**
 * Resolves a $ref string to its schema definition within the document.
 *
 * @param ref - A JSON pointer ref string e.g. `#/components/schemas/Foo`
 * @param doc - The OpenAPI document to resolve against
 * @returns The resolved schema, or undefined if the ref cannot be resolved
 */
export const resolveRef = (
  ref: string,
  doc: OpenApiDocument
): SchemaObject | undefined => {
  const parts = ref.replace('#/', '').split('/')
  let current: unknown = doc
  for (const part of parts) {
    if (!isRecord(current)) return undefined
    current = current[part]
  }
  if (!isRecord(current)) return undefined
  // biome-ignore lint/plugin/no-type-assertion: the document declares what its $ref targets are (trust boundary)
  return current as SchemaObject
}

/**
 * Flattens all schemas typed as oneOf[$ref, $ref, ...] where all refs resolve to enums
 * into a single merged enum. Enables API UI tools to render a dropdown instead of a text input.
 *
 * @param document - The OpenAPI document to modify
 * @returns A cloned document with flattened enum schemas
 */
export const flattenEnums = <T extends OpenApiDocument>(document: T): T => {
  const doc = clone(document)

  const flattenedEnum = (
    schema: SchemaObject | ReferenceObject
  ): SchemaObject | undefined => {
    if (!('oneOf' in schema) || !schema.oneOf) return undefined

    const values: string[] = []
    for (const s of schema.oneOf) {
      if (!('$ref' in s)) return undefined
      const resolved = resolveRef(s.$ref, doc)
      if (!resolved?.enum) return undefined
      for (const value of resolved.enum) {
        if (typeof value !== 'string') return undefined
        values.push(value)
      }
    }
    return values.length > 0
      ? { type: 'string', enum: [...new Set(values)] }
      : undefined
  }

  const flattenParameters = (
    parameters: (ParameterObject | ReferenceObject)[] = []
  ) => {
    for (const parameter of parameters) {
      if ('schema' in parameter && parameter.schema) {
        parameter.schema = flattenedEnum(parameter.schema) ?? parameter.schema
      }
    }
  }

  flattenParameters(Object.values(doc.components?.parameters ?? {}))

  if (doc.components?.schemas) {
    for (const [key, schema] of Object.entries(doc.components.schemas)) {
      doc.components.schemas[key] = flattenedEnum(schema) ?? schema
    }
  }

  for (const pathItem of Object.values(doc.paths)) {
    if ('$ref' in pathItem) continue
    flattenParameters(pathItem.parameters)
    for (const operation of operationsOf(pathItem)) {
      flattenParameters(operation.parameters)
    }
  }

  return doc
}
