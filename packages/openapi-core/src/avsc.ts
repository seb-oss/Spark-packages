export type AvroSchema =
  | AvroRecord
  | AvroEnum
  | AvroArray
  | AvroMap
  | AvroPrimitive
  | AvroUnion

export type AvroRecord = {
  type: 'record'
  name: string
  namespace?: string
  doc?: string
  fields: AvroField[]
}

export type AvroField = {
  name: string
  type: AvroSchema
  doc?: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  default?: any
  order?: 'ascending' | 'descending' | 'ignore'
}

export type AvroEnum = {
  type: 'enum'
  name: string
  symbols: string[]
  doc?: string
}

export type AvroArray = {
  type: 'array'
  items: AvroSchema
  doc?: string // Description
}

export type AvroMap = {
  type: 'map'
  values: AvroSchema
  doc?: string // Description
}

export type AvroUnion = AvroSchema[]

export type AvroPrimitive =
  | 'null'
  | 'boolean'
  | 'int'
  | 'long'
  | 'float'
  | 'double'
  | 'bytes'
  | 'string'
