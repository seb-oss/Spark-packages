import { toTypeScript } from '@ovotech/avro-ts'
import { type Schema, Type } from '@sebspark/avsc-isometric'

// Caches types for reference types in combined schemas
type TypeRecord = Record<string, Type>
const record: TypeRecord = {}

const parseSchema = (schema: Schema): string => {
  // get custom type definitions from record
  const type = Type.forSchema(schema, {
    typeHook: (typeSchema) => {
      if (typeof typeSchema === 'string') return record[typeSchema]
    },
  })
  let name = type.name
  // let itemName: string | undefined
  if (!name) {
    // handle array root type
    // biome-ignore lint/suspicious/noExplicitAny: any is required for dynamic type
    const dynamic = type as any

    if (!dynamic.itemsType?.name) throw new Error('Schema must have a name')

    name = `${dynamic.itemsType?.name}sArray`
    // itemName = `${dynamic.itemsType?.name}[]`
  }

  record[name] = type

  const ts = toTypeScript(schema)
    .replace(/"/gm, `'`) // single quote
    .replace(/(?!\/\*\*)(;)(?![^*]*\*\/)/gm, '') // remove semicolons outside of comment blocks
    .replace(/ {4}/g, '  ') // two spaces
    .replace(/^export type AvroType = .+(\[\]|(\n\n))/gm, '')

  return `${ts}\
export const ${name}Schema = ${JSON.stringify(type.schema())} as const satisfies Schema
export const ${name}Type = Type.forSchema(${name}Schema)
export type ${name}Payload = AvroPayload<typeof ${name}Schema>
`
}

export const parse = (...schemas: Schema[]): string => {
  const parsed = []
  let counter = 0
  const limit = (schemas.length * schemas.length) / 2
  while (schemas.length > 0) {
    const currentSchema = schemas.shift()

    if (!currentSchema) {
      throw new Error('Undefined schema')
    }

    try {
      const parsedSchema = parseSchema(currentSchema)
      parsed.push(parsedSchema)
    } catch (err) {
      const error = err as Error
      if (error.message.startsWith('undefined type name')) {
        schemas.push(currentSchema)
      } else {
        throw error
      }
    }

    if (counter++ > limit) {
      console.log()
      console.error('ERROR: Inconsistent schemas.')
      console.error(
        'Check for circular dependencies or missing types, then try again.'
      )

      throw new Error('circular dependency')
    }
  }

  return `// Auto generated. Do not edit!
import { Type, type Schema } from '@sebspark/avsc-isometric'

/**
 * Extracts the record definition from a schema branch
 */
type ExtractRecord<T> = T extends { name: infer N; fields: readonly any[] }
  ? N extends string
    ? { [K in N]: { [F in T['fields'][number] as F['name']]: ResolveType<F['type']> } }
    : never
  : never

/**
 * Resolves Avro types (int, string, arrays, unions) to TypeScript
 */
type ResolveType<T> = T extends 'int' | 'long' | 'double' ? number
  : T extends 'string' ? string
  : T extends readonly ['null', infer U] ? ResolveType<U> | null
  : T extends { type: 'array'; items: infer I } ? ResolveType<I>[]
  : T extends { name: string; fields: readonly any[] } ? { [F in T['fields'][number] as F['name']]: ResolveType<F['type']> }
  : any

/**
 * The final Payload structure derived from your specific Schema
 */
export type AvroPayload<S> = S extends { fields: readonly any[] }
  ? {
      [F in S['fields'][number] as F['name']]: F['name'] extends 'data'
        ? (S['fields'][number] & { name: 'data' })['type'] extends readonly any[]
          ? ExtractRecord<(S['fields'][number] & { name: 'data' })['type'][number]> | null
          : never
        : ResolveType<F['type']>
    }
  : never

${parsed.join('\n')}`
}
