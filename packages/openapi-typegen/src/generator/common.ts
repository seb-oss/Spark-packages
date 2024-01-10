import { pascalCase } from 'change-case'
import {
  ArrayType,
  CustomType,
  EmptyType,
  EnumType,
  Header,
  ObjectType,
  PrimitiveType,
  Property,
  ResponseBody,
  TypeDefinition,
  DocumentableType,
} from '../types'
import { document } from './document'

export const OR = ' | '
export const AND = ' & '

export const generateType = (parsed: TypeDefinition | EmptyType): string => {
  let type: string
  switch (parsed.type) {
    case undefined: {
      type = 'undefined'
      break
    }
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
  return type.replace(/ & \{\s*\}/g, '')
}

export const generateProperty = (property: Property): string => {
  const types = property.type.map(generateType)
  return `${document(property)}${propertyName(property.name)}${property.optional ? '?' : ''}: ${types.join(OR)}`
}

export const preamble = (type: DocumentableType): string =>
  type.name ? `${document(type)}export type ${typeName(type.name)} = ` : ''

export const typeName = (name: string): string => {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) return name
  return pascalCase(name)
}
export const propertyName = (name: string): string => {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) return name
  return `'${name}'`
}

export const extensions = (type: ObjectType): string =>
  type.extends.map(generateType).concat('').join(AND)

export const generatePrimitive = (parsed: PrimitiveType): string =>
  `${preamble(parsed)}${parsed.type}`

export const generateCustom = (parsed: CustomType): string =>
  `${preamble(parsed)}${parsed.type}`

export const generateObject = (parsed: ObjectType): string => {
  const lines: string[] = []
  lines.push(`${preamble(parsed)}${extensions(parsed)}{`)
  lines.push(...parsed.properties.map(generateProperty))
  lines.push('}')
  return lines.join('\n')
}

export const generateArray = (parsed: ArrayType): string => {
  const lines: string[] = []
  lines.push(`${preamble(parsed)}${parsed.items.type}[]`)
  return lines.join('\n')
}

export const generateEnum = (parsed: EnumType): string => {
  return `${preamble(parsed)}${parsed.values.map(serializeValue).join(OR)}`
}

export const generateHeader = (header: Header): string => {
  return `${preamble(header)}{ ${propertyName(header.name)}${header.optional ? '?' : ''}: ${generateType(header.type)} }`
}

export const generateBody = (body: ResponseBody): string => {
  return `${preamble(body)}APIResponse<${generateType(body.data)}, ${body.headers.length ? generateHeaders(body.headers) : 'never'}>`
}

export const generateHeaders = (headers: Header[]): string => {
  const tokens: string[] = []

  tokens.push('{')
  for (const header of headers) {
    tokens.push(`${propertyName(header.name)}${header.optional ? '?' : ''}: ${generateType(header.type)}`)
  }
  tokens.push('}')

  return tokens.join('\n')
}

export const serializeValue = (value: unknown): unknown => {
  if (typeof value === 'string') return `'${value}'`
  return value
}
