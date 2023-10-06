import { toTypeScript } from '@ovotech/avro-ts'
import { Schema, Type } from 'avsc'

const parseSchema = (schema: Schema): string => {
  const type = Type.forSchema(schema)
  const name = type.name
  const ts = toTypeScript(schema)
    .replace(/"/mg, `'`)    // single quote
    .replace(/;/mg, '')     // no semicolons
    .replace('    ', '  ')  // two spaces
    .replace(`export type AvroType = ${name}\n\n`, '')

  return `${ts}
const avro${name} = Type.forSchema(${JSON.stringify(schema)})

export const ${name} = {
  toBuffer: (data: ${name}) => avro${name}.toBuffer(data)
  fromBuffer: (buffer: Buffer) => avro${name}.fromBuffer(buffer) as ${name}
}
`
}

export const parse = (...schemas: Schema[]): string => {
  const parsed = schemas.map((schema) => parseSchema(schema))
  return `// Auto generated. Do not edit!
import { Type } from 'avsc'

${parsed.join('\n')}`
}
