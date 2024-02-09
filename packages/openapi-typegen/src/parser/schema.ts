import { ReferenceObject, SchemaObject } from '@sebspark/openapi-core'
import { ArrayType, ObjectType, Property, TypeDefinition } from '../types'
import { parseDocumentation, parseEnumType, parseRef } from './common'

export const parseSchemas = (
  schemas: Record<string, SchemaObject> = {}
): TypeDefinition[] =>
  Object.entries(schemas || {}).map(([name, schema]) =>
    parseSchema(name, schema)
  )

export const parseSchema = (
  name: string | undefined,
  schemaOrRef: SchemaObject | ReferenceObject
): TypeDefinition => {
  const ref = (schemaOrRef as ReferenceObject).$ref
  if (ref) {
    return { name, type: parseRef(ref) }
  }

  const schema = schemaOrRef as SchemaObject
  switch (schema.type) {
    case 'array':
      return parseArraySchema(name, schema)
    case 'boolean':
    case 'integer':
    case 'number':
    case 'string':
      return schema.enum
        ? parseEnumType(name, schema)
        : parsePropertyType(schema)[0]
    default:
      return parseObjectSchema(name, schema)
  }
}

const parseObjectSchema = (
  name: string | undefined,
  schema: SchemaObject
): ObjectType => {
  const type: ObjectType = {
    name,
    type: 'object',
    properties: [],
    extends: [],
    ...parseDocumentation(schema),
  }
  if (schema.properties) {
    type.properties = Object.entries(schema.properties).map(
      ([name, property]) => parseProperty(name, property, schema.required || [])
    )
  }
  if (schema.allOf) {
    type.extends = schema.allOf.flatMap(parsePropertyType)
  }
  return type
}

const parseArraySchema = (
  name: string | undefined,
  schema: SchemaObject
): ArrayType => {
  if (schema.type !== 'array' || !schema.items) throw new Error('Not an array')
  return {
    name,
    type: 'array',
    items: parsePropertyType(schema.items)[0],
    ...parseDocumentation(schema),
  }
}

export const parseProperty = (
  name: string,
  schema: SchemaObject | ReferenceObject,
  required: string[]
): Property => {
  const property: Property = {
    name,
    optional: !required.includes(name),
    type: parsePropertyType(schema),
    ...parseDocumentation(schema as SchemaObject),
  }

  return property
}

const parsePropertyType = (
  property: SchemaObject | ReferenceObject
): TypeDefinition[] => {
  const ref = (property as ReferenceObject).$ref

  if (ref) {
    return [{ type: parseRef(ref) }]
  }
  const schemaObject = property as SchemaObject
  if (schemaObject.type) {
    return (
      Array.isArray(schemaObject.type) ? schemaObject.type : [schemaObject.type]
    ).map((type) => {
      switch (type) {
        case 'array': {
          return parseArraySchema(undefined, schemaObject)
        }
        case 'object': {
          return parseObjectSchema(undefined, schemaObject)
        }
        case 'integer': {
          return { type: 'number', ...parseDocumentation(schemaObject) }
        }
        case 'string': {
          switch (schemaObject.format) {
            case 'date':
            case 'date-time': {
              return { type: 'Date', ...parseDocumentation(schemaObject) }
            }
            default: {
              return { type, ...parseDocumentation(schemaObject) }
            }
          }
        }
        default: {
          return { type, ...parseDocumentation(schemaObject) }
        }
      }
    })
  }
  if (schemaObject.allOf) {
    const types: TypeDefinition[] = []
    for (const allOf of schemaObject.allOf) {
      const type = parseSchema(undefined, allOf)
      // biome-ignore lint/performance/noDelete: <explanation>
      delete type.name
      types.push(type)
    }
    return types
  }

  return []
}
