import { pascalCase } from 'change-case'
import {
  ArrayType,
  CustomType,
  Discriminator,
  DocumentableType,
  EnumType,
  Header,
  ObjectType,
  PrimitiveType,
  Property,
  ResponseBody,
  TypeDefinition,
} from '../types'
import { document } from './document'

export const OR = ' | '
export const AND = ' & '

export const generateType = (parsed: TypeDefinition): string => {
  let type: string
  switch (parsed.type) {
    case 'enum': {
      type = generateEnum(parsed as EnumType)
      break
    }
    case 'array': {
      type = generateArray(parsed as ArrayType)
      break
    }
    case 'object': {
      type = generateObject(parsed as ObjectType)
      break
    }
    case 'Date':
    case 'bigint':
    case 'boolean':
    case 'null':
    case 'number':
    case 'string':
    case 'symbol':
    case 'undefined':
      type = generatePrimitive(parsed as PrimitiveType)
      break
    default: {
      type = generateCustom(parsed as CustomType)
    }
  }
  return type.replace(/ [&|] \{\s*\}/g, '')
}

export const generateProperty = (property: Property): string => {
  const types = property.type.map(generateType)
  return `${document(property)}${propertyName(property.name)}${
    property.optional ? '?' : ''
  }: ${types.join(OR) || 'unknown'}`
}

export const preamble = (type: DocumentableType): string =>
  type.name ? `${document(type)}export type ${typeName(type.name)} = ` : ''

export const rxProperVariable = /^[a-zA-Z_<>$][a-zA-Z0-9_<>$]*$/

export const typeName = (name: string): string => {
  if (rxProperVariable.test(name)) return name
  return pascalCase(name)
}
export const propertyName = (name: string): string => {
  if (rxProperVariable.test(name)) return name
  return `'${name}'`
}

export const extensions = (type: ObjectType): string =>
  (type.allOf || []).map(generateType).concat('').join(AND) +
  parseOptional(type.oneOf, type.discriminator)

const parseOptional = (
  optional?: (ObjectType | CustomType)[],
  discriminator?: Discriminator
): string => {
  const tokens: string[] = []
  const map = reverseDiscriminator(discriminator)
  for (const type of optional || []) {
    if (type.type === 'object') tokens.push(generateType(type))
    else {
      const custom = type as CustomType
      if (!map[custom.type]) tokens.push(generateType(custom))
      else {
        tokens.push(
          `(${generateType(custom)} & { ${discriminator?.propertyName}: '${
            map[custom.type]
          }' })`
        )
      }
    }
  }
  if (tokens.length) tokens.push('')
  return tokens.join(OR)
}

const reverseDiscriminator = (
  discriminator?: Discriminator
): Record<string, string> => {
  const reverse: Record<string, string> = {}
  if (!discriminator) return reverse
  for (const [val, { type }] of Object.entries(discriminator.mapping)) {
    reverse[type] = val
  }
  return reverse
}

export const generatePrimitive = (parsed: PrimitiveType): string =>
  `${preamble(parsed)}${parsed.type}`

export const generateCustom = (parsed: CustomType): string =>
  `${preamble(parsed)}${typeName(parsed.type)}`

export const generateObject = (parsed: ObjectType): string => {
  const lines: string[] = []
  lines.push(`${preamble(parsed)}${extensions(parsed)}{`)
  lines.push(...parsed.properties.map(generateProperty))
  lines.push('}')
  return lines.join('\n')
}

export const generateArray = (parsed: ArrayType): string => {
  const lines: string[] = []
  const items = generateType(parsed.items)
  lines.push(`${preamble(parsed)}${items}[]`)
  return lines.join('\n')
}

export const generateEnum = (parsed: EnumType): string => {
  return `${preamble(parsed)}${parsed.values.map(serializeValue).join(OR)}`
}

export const generateHeader = (header: Header): string => {
  return `${preamble(header)}{ ${propertyName(header.name)}${
    header.optional ? '?' : ''
  }: ${generateType(header.type)} }`
}

export const generateResponseBody = (
  type: ResponseBody | CustomType,
  optional = true
): string => {
  const customType = (type as CustomType).type
  if (customType) return typeName(customType)

  const body = type as ResponseBody
  if (!body.data && !body.headers) return 'undefined'

  const tokens: string[] = []
  tokens.push(preamble(body))
  tokens.push('APIResponse<')
  tokens.push(
    body.data ? generateType(serialized(body.data, optional)) : 'undefined'
  )
  if (body.headers) {
    tokens.push(', ')
    tokens.push(body.headers ? generateHeaders(body.headers) : 'undefined')
  }
  tokens.push('>')
  return tokens.join('')
}

const serialized = (orig: TypeDefinition, optional = true): TypeDefinition => {
  switch (orig.type) {
    case 'bigint':
    case 'boolean':
    case 'enum':
    case 'null':
    case 'number':
    case 'string':
    case 'symbol':
    case 'undefined': {
      return orig
    }
    case 'Date': {
      return { ...orig, type: 'string' }
    }
    case 'array': {
      return {
        ...orig,
        items: serialized((orig as ArrayType).items, optional),
      } as ArrayType
    }
    case 'object': {
      return orig
    }
    default: {
      const wrapper = optional ? 'PartiallySerialized' : 'Serialized'
      return { ...orig, type: `${wrapper}<${typeName(orig.type)}>` }
    }
  }
}

export const generateHeaders = (headers: Header[]): string => {
  const tokens: string[] = []

  for (const header of headers) {
    tokens.push(
      `${propertyName(header.name)}${
        header.optional ? '?' : ''
      }: ${generateType(header.type)}`
    )
  }

  return `{${tokens.join(', ')}}`
}

export const serializeValue = (value: unknown): unknown => {
  if (typeof value === 'string') return `'${value}'`
  return value
}
