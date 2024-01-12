import { pascalCase } from 'change-case'
import {
  ArrayType,
  CustomType,
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
  return type.replace(/ & \{\s*\}/g, '')
}

export const generateProperty = (property: Property): string => {
  const types = property.type.map(generateType)
  return `${document(property)}${propertyName(property.name)}${
    property.optional ? '?' : ''
  }: ${types.join(OR)}`
}

export const preamble = (type: DocumentableType): string =>
  type.name ? `${document(type)}export type ${typeName(type.name)} = ` : ''

export const typeName = (name: string): string => {
  if (rxProperVariable.test(name)) return name
  return pascalCase(name)
}
export const propertyName = (name: string): string => {
  if (rxProperVariable.test(name)) return name
  return `'${name}'`
}

export const rxProperVariable = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

export const extensions = (type: ObjectType): string =>
  type.extends.map(generateType).concat('').join(AND)

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
  lines.push(`${preamble(parsed)}${parsed.items.type}[]`)
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
  type: ResponseBody | CustomType
): string => {
  const customType = (type as CustomType).type
  if (customType) return typeName(customType)

  const body = type as ResponseBody
  if (!body.data && !body.headers) return 'undefined'

  const tokens: string[] = []
  tokens.push(preamble(body))
  tokens.push('APIResponse<')
  tokens.push(body.data ? generateType(body.data) : 'undefined')
  if (body.headers) {
    tokens.push(', ')
    tokens.push(body.headers ? generateHeaders(body.headers) : 'undefined')
  }
  tokens.push('>')
  return tokens.join('')
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
