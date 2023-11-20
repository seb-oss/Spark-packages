import { ParsedProperty, ParsedType } from './types'

const formatDocs = (description?: string): string => {
  if (description) {
    return `
/**
* ${description}
 */
`
  } else {
    return ''
  }
}

export const formatTypeName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9_$]/g, '_')
}

const formatParsedType = (parsedType: ParsedType) => {
  return `${formatDocs(parsedType.description)}export type ${
    parsedType.name
  } = ${parsedType.type}`
}

export const formatParsedTypes = (types: ParsedType[]): string[] => {
  const rows: string[] = []

  for (const type of Object.values(types)) {
    rows.push(formatParsedType(type))
  }

  return rows
}

export const formatProperties = (properties: ParsedProperty[]) => {
  const allProps = properties
    .map(({ name, required, value, description }) => {
      return `${formatDocs(
        description
      )}'${name}'${required ? '' : '?'}: ${value}`
    })
    .join('; ')
  return `{${allProps}}`
}
