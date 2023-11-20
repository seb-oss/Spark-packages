import { toTypeScript } from '@ovotech/avro-ts'
import { Schema, Type } from '@sebspark/avsc-isometric'

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
  let itemName: string | undefined
  if (!name) {
    //handle array root type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dynamic = type as any

    if (!dynamic.itemsType?.name) throw new Error('Schema must have a name')

    name = dynamic.itemsType?.name + 'sArray'
    itemName = dynamic.itemsType?.name + '[]'
  }

  record[name] = type

  const ts = toTypeScript(schema)
    .replace(/"/gm, `'`) // single quote
    .replace(/;/gm, '') // no semicolons
    .replace(/ {4}/g, '  ') // two spaces
    .replace(/^export type AvroType = .+(\[\]|(\n\n))/gm, '')

  return `${ts}
const avro${name} = Type.forSchema(${JSON.stringify(type.schema())})

export const ${name}Converter = {
  toBuffer: (data: ${itemName || name}) => avro${name}.toBuffer(data),
  fromBuffer: (buffer: Buffer) => avro${name}.fromBuffer(buffer) as ${
    itemName || name
  }
}
`
}

export const parse = (...schemas: Schema[]): string => {
  const parsed = []
  let counter = 0
  const limit = (schemas.length * schemas.length) / 2
  while (schemas.length > 0) {
    const currentSchema = schemas.shift()!
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
import { Type } from '@sebspark/avsc-isometric'

${parsed.join('\n')}`
}
