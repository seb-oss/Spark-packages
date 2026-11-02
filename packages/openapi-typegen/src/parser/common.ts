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
): EnumType => {
  /* istanbul ignore next */
  const values = schema.enum || []
  return { name, type: 'enum', values }
}

const SCHEMA_PATHS = [
  'schemas',
  'parameters',
  'headers',
  'requestBodies',
  'securitySchemes',
] as const
type SchemaPath = (typeof SCHEMA_PATHS)[number]
const isSchemaPath = (path: string): path is SchemaPath =>
  SCHEMA_PATHS.some((p) => p === path)
/* istanbul ignore next */
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
  const schemaPath = isSchemaPath(path) ? components[path] : undefined
  /* istanbul ignore next */
  if (!schemaPath?.[name]) throw new Error(`Cannot find ref ${ref}`)
  // biome-ignore lint/plugin/no-type-assertion: the caller states which component kind the ref points to
  return schemaPath[name] as T
}

type Documented = {
  title?: string
  description?: string
}
export const parseDocumentation = (source: object): Partial<Documented> => {
  const documented: Documented = {}
  if ('title' in source && typeof source.title === 'string' && source.title)
    documented.title = source.title
  if (
    'description' in source &&
    typeof source.description === 'string' &&
    source.description
  )
    documented.description = source.description
  return documented
}
