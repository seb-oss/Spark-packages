import type {
  ReferenceObject,
  SchemaObject,
  SchemaType,
} from '@sebspark/openapi-core'
import type {
  ArrayType,
  CustomType,
  EnumType,
  ObjectType,
  Primitive,
  PrimitiveType,
  Property,
  RecordType,
  TypeDefinition,
} from '../types'
import { parseDocumentation, parseEnumType, parseRef } from './common'

export const parseSchemas = (
  schemas: Record<string, SchemaObject> = {}
): TypeDefinition[] =>
  Object.entries(schemas || {}).map(([name, schema]) =>
    parseSchema(name, schema)
  )

const marshall = (
  type: Omit<SchemaType, 'object' | 'array'>,
  format: string | undefined
): Primitive => {
  if (type === 'integer') {
    return 'number'
  }
  if (type === 'string' && (format === 'date' || format === 'date-time')) {
    return 'Date'
  }
  return type as Primitive
}

export const parseSchema = (
  name: string | undefined,
  schemaOrRef: SchemaObject | ReferenceObject,
  generateDocs = true
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
        : name
          ? { name, type: marshall(schema.type, schema.format) }
          : parsePropertyType(schema, generateDocs)[0]
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
    ...parseDocumentation(schema),
  }
  if (schema.properties) {
    type.properties = Object.entries(schema.properties).map(
      ([name, property]) => parseProperty(name, property, schema.required || [])
    )
  }
  if (schema.allOf) {
    type.allOf = schema.allOf.flatMap((s) => parsePropertyType(s))
  }
  if (schema.oneOf) {
    type.oneOf = schema.oneOf.flatMap((s) => parsePropertyType(s))
  }
  if (schema.anyOf) {
    type.oneOf = schema.anyOf.flatMap((s) => parsePropertyType(s))
  }
  if (schema.discriminator?.mapping) {
    const mapping: Record<string, CustomType> = {}
    for (const [prop, ref] of Object.entries(schema.discriminator.mapping)) {
      mapping[prop] = { type: parseRef(ref) }
    }
    type.discriminator = {
      propertyName: schema.discriminator.propertyName,
      mapping,
    }
  }
  if (schema.additionalProperties) {
    const record = parseAdditionalProperties(schema.additionalProperties)
    if (!type.allOf) {
      type.allOf = []
    }
    type.allOf.push(record)
  }
  return type
}

const parseAdditionalProperties = (
  schema: true | SchemaObject | ReferenceObject
): RecordType => {
  let items: TypeDefinition
  if (schema === true) {
    items = { type: 'undefined' } as PrimitiveType
  } else {
    items = parseSchema(undefined, schema)
  }
  return {
    type: 'record',
    items,
  } as RecordType
}

const parseArraySchema = (
  name: string | undefined,
  schema: SchemaObject
): ArrayType => {
  if (schema.type !== 'array') throw new Error('Not an array')
  return {
    name,
    type: 'array',
    items: schema.items
      ? parseSchema(undefined, schema.items, false)
      : { type: 'unknown' },
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
  property: SchemaObject | ReferenceObject,
  generateDocs = true
): TypeDefinition[] => {
  const ref = (property as ReferenceObject).$ref

  if (ref) {
    return [{ type: parseRef(ref) }]
  }
  const schemaObject = property as SchemaObject
  const docs = generateDocs ? parseDocumentation(schemaObject) : {}
  if (schemaObject.enum) {
    const enumType: EnumType = {
      type: 'enum',
      values: schemaObject.enum,
      ...docs,
    }
    return [enumType]
  }
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
        default: {
          return {
            type: marshall(type, schemaObject.format),
            ...docs,
          }
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
