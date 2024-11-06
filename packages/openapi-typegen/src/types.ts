import type { ParameterIn, Verb } from '@sebspark/openapi-core'

export type Primitive =
  | 'string'
  | 'number'
  | 'boolean'
  | 'bigint'
  | 'symbol'
  | 'null'
  | 'undefined'
  | 'Date'

export type Property = {
  name: string
  title?: string
  description?: string
  type: TypeDefinition[]
  optional: boolean
}

export type TypeDefinition =
  | PrimitiveType
  | ObjectType
  | ArrayType
  | CustomType
  | EnumType
  | RecordType

type BaseType = {
  name?: string
  title?: string
  description?: string
}

export type RecordType = BaseType & {
  type: 'record'
  items: TypeDefinition
}

export type PrimitiveType = BaseType & {
  type: Primitive
}

export type UnknownType = BaseType & {
  type: 'unknown'
}

export type ArrayType = BaseType & {
  type: 'array'
  items: CustomType | ObjectType | ArrayType | EnumType
}

export type Discriminator = {
  propertyName: string
  mapping: Record<string, CustomType>
}

export type ObjectType = BaseType & {
  type: 'object'
  properties: Property[]
  allOf?: (CustomType | ObjectType | RecordType)[]
  anyOf?: (CustomType | ObjectType)[]
  oneOf?: (CustomType | ObjectType)[]
  discriminator?: Discriminator
}

export type CustomType = BaseType & {
  type: string & {}
}

export type EnumType = BaseType & {
  type: 'enum'
  values: (string | number | boolean)[]
}

export type ParsedOpenApiDocument = {
  paths: Path[]
  components: ParsedComponents
}

export type ParsedComponents = {
  schemas: TypeDefinition[]
  parameters: Parameter[]
  headers: Header[]
  requestBodies: TypeDefinition[]
  responseBodies: ResponseBody[]
  securitySchemes: Parameter[]
}

export type Path = {
  url: string
  method: Verb
  responses: Record<number, ResponseBody | CustomType>
  args?: RequestArgs
  title?: string
  description?: string
}

export type Args = ObjectType & { optional: boolean }
export type RequestArgs = Partial<Record<ParameterIn, Args>> & {
  body?: Args
}

export type Parameter = {
  in: ParameterIn
  name?: string
  parameterName: string
  type: TypeDefinition
  optional: boolean
  title?: string
  description?: string
}

export type Header = {
  name: string
  optional: boolean
  type: TypeDefinition
}

export type ResponseBody = {
  name?: string
  description?: string
  data?: TypeDefinition
  headers?: Header[]
}

export type DocumentableType = Partial<{
  name?: string
  title?: string
  description?: string
}>
