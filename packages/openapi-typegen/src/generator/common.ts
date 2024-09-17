import { pascalCase } from 'change-case'
import type {
  ArrayType,
  CustomType,
  Discriminator,
  DocumentableType,
  EnumType,
  Header,
  ObjectType,
  PrimitiveType,
  Property,
  RecordType,
  ResponseBody,
  TypeDefinition,
  UnknownType,
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
    case 'record': {
      type = generateRecord(parsed as RecordType)
      break
    }
    case 'unknown': {
      type = generateUnknown(parsed as UnknownType)
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

const isValidName = (name: string): boolean => {
  const namingConventionRegex =
    /^([A-Z_]\w*)([a-z_]\w*)(<([a-z_]\w*(,\s*)?)+>)?$/
  const hasCapitalLetterRegex = /[A-Z]/

  // Check if the name follows the basic structural rules
  if (!namingConventionRegex.test(name)) return false

  if (!hasCapitalLetterRegex.test(name)) {
    return false
  }

  // Further check for starting lowercase without underscore in the rest of the name
  if (name[0] !== name[0].toUpperCase() && !name.includes('_')) {
    return false
  }

  return true
}

export const typeName = (name: string): string => {
  // Check if the name already conforms to the naming rules
  if (isValidName(name)) {
    return name // Return the name untouched if it conforms
  }
  // Handle generics separately by processing the content within <>
  if (name.includes('<')) {
    return name.replace(
      /<([^>]+)>/,
      (_match, genericContent) => `<${typeName(genericContent)}>`
    )
  }

  // Directly transform domain-style names, preserving underscores for segments
  const domainStyleTransformed = name
    .split('.')
    .map((part, index, array) => {
      // Apply pascal case only to the last segment
      if (index === array.length - 1) {
        return pascalCase(part) // Using external pascalCase
      }
      return part
    })
    .join('_')

  // Handle names starting with numbers
  const prefixedIfNumberStart = domainStyleTransformed.match(/^\d/)
    ? `_${domainStyleTransformed}`
    : domainStyleTransformed

  // For other transformations, apply pascalCase if not already handled by domain style transformation
  const finalName = prefixedIfNumberStart.includes('_')
    ? prefixedIfNumberStart
    : pascalCase(prefixedIfNumberStart)

  // Ensure capitalization of the first character, in case pascalCase did not apply (e.g., underscores present)
  // Modification: Check if the finalName includes '_', indicating a domain-style name or a number prefix,
  // and avoid changing the case of the entire string
  if (finalName.includes('_')) {
    // Only capitalize the segment after the last underscore if it's a domain-style name
    const lastUnderscoreIndex = finalName.lastIndexOf('_')
    if (
      lastUnderscoreIndex !== -1 &&
      lastUnderscoreIndex < finalName.length - 1
    ) {
      return (
        finalName.substring(0, lastUnderscoreIndex + 1) +
        finalName.charAt(lastUnderscoreIndex + 1).toUpperCase() +
        finalName.slice(lastUnderscoreIndex + 2)
      )
    }
    return finalName
  }
  // Apply capitalization for non-domain style names
  return finalName.charAt(0).toUpperCase() + finalName.slice(1)
}

export const propertyName = (name: string): string => {
  if (rxProperVariable.test(name.replace(/\./g, '_')))
    return name.replace(/\./g, '_')
  return `'${name.replace(/\./g, '_')}'`
}

export const extensions = (type: ObjectType): string =>
  (type.allOf || []).map(generateType).concat('').join(AND) +
  (type.oneOf || []).map(generateType).concat('').join(OR)

export const generatePrimitive = (parsed: PrimitiveType): string =>
  `${preamble(parsed)}${parsed.type}`

export const generateCustom = (parsed: CustomType): string =>
  `${preamble(parsed)}${typeName(parsed.type)}`

export const generateUnknown = (parsed: UnknownType): string =>
  `${preamble(parsed)}unknown`

export const generateObject = (parsed: ObjectType): string => {
  const lines: string[] = []
  lines.push(`${preamble(parsed)}${extensions(parsed)}{`)
  lines.push(...parsed.properties.map(generateProperty))
  lines.push('}')

  if (parsed.discriminator && parsed.name) {
    lines.push(generateDiscriminator(parsed.discriminator, parsed.name))
  }

  return lines.join('\n')
}

export const generateRecord = (parsed: RecordType): string => {
  const itemType =
    parsed.items.type === 'undefined' ? 'unknown' : generateType(parsed.items)
  return `Record<string, ${itemType}>`
}

const generateDiscriminator = (
  discriminator: Discriminator,
  name: string
): string => {
  const lines: string[] = ['']
  lines.push(`export type ${name}Discriminator = {`)
  for (const [key, type] of Object.entries(discriminator.mapping)) {
    lines.push(`${key}: ${type.type}`)
  }
  lines.push('}')
  return lines.join('\n')
}

export const generateArray = (parsed: ArrayType): string => {
  const lines: string[] = []
  let items = generateType(parsed.items)
  if (parsed.items.type === 'enum' || 'oneOf' in parsed.items) {
    items = `(${items})`
  }
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
