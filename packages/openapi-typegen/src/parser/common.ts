import type {
  ComponentsObject,
  HeaderObject,
  ParameterObject,
  RequestBodyObject,
  SchemaObject,
  SecuritySchemeObject,
} from '@sebspark/openapi-core'
import type { EnumType } from '../types'

export const parseRef = (ref: string): string =>
  ref.substring(ref.lastIndexOf('/') + 1)

export const parseEnumType = (
  name: string | undefined,
  schema: SchemaObject
): EnumType => ({ name, type: 'enum', values: schema.enum || [] })

type SchemaPath =
  | 'schemas'
  | 'parameters'
  | 'headers'
  | 'requestBodies'
  | 'securitySchemes'
type SchemaType =
  | SchemaObject
  | ParameterObject
  | HeaderObject
  | RequestBodyObject
  | SecuritySchemeObject
export const findRef = <T extends SchemaType>(
  components: ComponentsObject,
  ref: string
): T => {
  const [, , path, name] = ref.split('/')
  const schemaPath = components[path as SchemaPath]
  if (!schemaPath || !schemaPath[name])
    throw new Error(`Cannot find ref ${ref}`)
  return schemaPath[name] as T
}

type Documented = {
  title?: string
  description?: string
}
export const parseDocumentation = (
  source: Partial<Documented>
): Partial<Documented> => {
  const documented: Documented = {}
  if (source.title) documented.title = source.title
  if (source.description) documented.description = source.description
  return documented
}
