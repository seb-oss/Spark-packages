import type { SchemaObject } from './common'
import type { OpenApiDocument, OperationObject } from './openapi'
import type { APIServerDefinition } from './types'

const clone = <T>(orig: T): T => JSON.parse(JSON.stringify(orig))

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
  for (const path of Object.keys(doc.paths)) {
    const pathObj = doc.paths[path as keyof typeof doc.paths]
    const fixedPath = path.replace(/{(.+)}/, ':$1')
    if (!server[fixedPath] && !fixedPath.startsWith('/health')) {
      for (const method of Object.values(pathObj)) {
        const operation = method as OperationObject
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
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
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

  const flatten = (schema: SchemaObject): SchemaObject => {
    if (!('oneOf' in schema) || !schema.oneOf) return schema

    let allEnums = true
    const enumValues: unknown[] = []

    for (const s of schema.oneOf) {
      if (!('$ref' in s)) {
        allEnums = false
        break
      }
      const resolved = resolveRef(s.$ref, doc)
      if (!resolved || !('enum' in resolved) || !Array.isArray(resolved.enum)) {
        allEnums = false
        break
      }
      for (const v of resolved.enum) enumValues.push(v)
    }

    if (allEnums && enumValues.length > 0) {
      return { type: 'string', enum: [...new Set(enumValues)] as string[] }
    }
    return schema
  }

  if (doc.components?.parameters) {
    for (const parameter of Object.values(doc.components.parameters)) {
      parameter.schema = flatten(
        parameter.schema as SchemaObject
      ) as unknown as typeof parameter.schema
    }
  }

  if (doc.components?.schemas) {
    for (const [key, schema] of Object.entries(doc.components.schemas)) {
      doc.components.schemas[key] = flatten(
        schema as SchemaObject
      ) as unknown as typeof schema
    }
  }

  for (const pathItem of Object.values(doc.paths)) {
    for (const operation of Object.values(pathItem)) {
      const op = operation as OperationObject
      if (!op.parameters) continue
      for (const parameter of op.parameters) {
        if ('schema' in parameter) {
          parameter.schema = flatten(
            parameter.schema as SchemaObject
          ) as unknown as typeof parameter.schema
        }
      }
    }
  }

  return doc
}
