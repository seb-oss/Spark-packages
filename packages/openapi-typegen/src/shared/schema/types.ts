import { ReferenceObject, SchemaObject } from './specification'

export type Components = {
  components: {
    schemas: Record<string, ReferenceObject | SchemaObject>
  }
}

export type ParsedType = {
  name: string
  type: string
  description?: string
}

export type ParsedProperty = {
  name: string
  value: string
  required: boolean
  description?: string
}
