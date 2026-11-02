import type { ReferenceObject } from '@sebspark/openapi-core'
import type {
  ArrayType,
  CustomType,
  EnumType,
  ObjectType,
  PrimitiveType,
  RecordType,
  ResponseBody,
  TypeDefinition,
} from './types'

/*
 * `CustomType['type']` is `string & {}`, so TypeScript cannot narrow
 * `TypeDefinition` by its `type` discriminant. These guards do it instead.
 */

const PRIMITIVES = new Set<string>([
  'string',
  'number',
  'boolean',
  'bigint',
  'symbol',
  'null',
  'undefined',
  'Date',
])

export const isEnumType = (t: TypeDefinition): t is EnumType =>
  t.type === 'enum'

export const isArrayType = (t: TypeDefinition): t is ArrayType =>
  t.type === 'array'

export const isObjectType = (t: TypeDefinition): t is ObjectType =>
  t.type === 'object'

export const isRecordType = (t: TypeDefinition): t is RecordType =>
  t.type === 'record'

export const isPrimitiveType = (t: TypeDefinition): t is PrimitiveType =>
  PRIMITIVES.has(t.type)

export const isCustomType = (t: ResponseBody | CustomType): t is CustomType =>
  'type' in t && typeof t.type === 'string' && !!t.type

export const isReference = (value: object): value is ReferenceObject =>
  '$ref' in value && typeof value.$ref === 'string' && value.$ref !== ''
