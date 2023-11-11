export type ReferenceObject = { $ref: string }

export interface SchemaObject {
  title?: string // ignored
  description?: string
  required?: string[]
  enum?: string[]
  type?: string // assumed "object" if missing
  items?: ReferenceObject | SchemaObject
  allOf?: (ReferenceObject | SchemaObject)[]
  properties?: Record<string, ReferenceObject | SchemaObject>
  default?: unknown
  additionalProperties?: boolean | ReferenceObject | SchemaObject
  nullable?: boolean // V3 ONLY
  oneOf?: (ReferenceObject | SchemaObject)[] // V3 ONLY
  anyOf?: (ReferenceObject | SchemaObject)[] // V3 ONLY
  format?: string // V3 ONLY
}
