/* eslint-disable complexity */
import { AddImportFn, Import } from '../imports'
import { formatProperties, formatTypeName } from './format'
import { ReferenceObject, SchemaObject } from './specification'
import { ParsedProperty, ParsedType } from './types'

export const parseRefString = (refString: string, addImport: AddImportFn) => {
  const [file, rest] = refString.split('#')
  const typeName = formatTypeName(rest.substring(rest.lastIndexOf('/') + 1))
  if (file && file.length > 0) {
    const [fileName] = file.split('.')
    addImport({ file: fileName, type: typeName })
  }
  return typeName
}

export const parseTypes = (
  schemas: Record<string, ReferenceObject | SchemaObject>,
): [ParsedType[], Import[]] => {
  const imports = [] as Import[]
  const types = Object.entries(schemas).map(([name, schema]) => {
    const schemaObj = schema as SchemaObject
    return {
      name: formatTypeName(name),
      type: generateFromSchemaObject(schemaObj, (importData) => {
        imports.push(importData)
      }),
      description: schemaObj.description,
    }
  })
  return [types, imports]
}

const guessType = (schema: SchemaObject) => {
  if (schema.type) {
    return schema.type
  } else if (schema.enum) {
    return 'string'
  } else if (schema.properties) {
    return 'object'
  } else {
    return undefined
  }
}

export const generateFromSchemaObject = (
  schema: ReferenceObject | SchemaObject,
  addImport: AddImportFn,
): string => {
  if ('$ref' in schema) {
    const { $ref } = schema as ReferenceObject
    return parseRefString($ref, addImport)
  }

  const type = guessType(schema)
  let schemaString = ''
  if (type) {
    if (type === 'object') {
      schemaString = generateObject(schema, addImport)
    } else if (type === 'array') {
      const arrayType = generateFromSchemaObject(schema.items!, addImport)
      if (arrayType && arrayType.length) {
        schemaString = `(${arrayType})[]`
      } else {
        schemaString = '[]'
      }
    } else {
      switch (type) {
        case 'integer':
          schemaString = 'number'
          break
        case 'string': {
          if (schema.format === 'date-time' || schema.format === 'date') {
            schemaString = 'Date'
          } else if (schema.enum) {
            schemaString = schema.enum.map((it) => `'${it}'`).join(' | ')
          } else {
            schemaString = 'string'
          }
          break
        }
        default:
          schemaString = type
      }
    }
  }
  if (schema.allOf) {
    const allOfString = schema.allOf
      .map((it) => generateFromSchemaObject(it, addImport))
      .join(' & ')
    if (allOfString.length > 0) {
      schemaString = schemaString + ' & ' + allOfString
    }
  }
  if (schema.anyOf) {
    const anyOfString = schema.anyOf
      .map((it) => generateFromSchemaObject(it, addImport))
      .map((it) => `Partial<${it}>`)
      .join(' & ')
    if (anyOfString.length > 0) {
      schemaString = schemaString + ' & ' + anyOfString
    }
  }

  if (schema.oneOf) {
    const oneOfString = schema.oneOf
      .map((it) => generateFromSchemaObject(it, addImport))
      .join(' | ')
    if (oneOfString.length > 0) {
      schemaString = schemaString + ' & (' + oneOfString + ')'
    }
  }

  if (!schemaString || !schemaString.length) {
    schemaString = 'string' // Default to string if no type was found
  }

  return schemaString
}

const generateObject = (schema: SchemaObject, addImport: AddImportFn) => {
  const requiredFields = schema.required ?? []
  const properties: Record<string, ParsedProperty> = Object.entries(
    schema.properties ?? [],
  )
    .map(([name, schema]) => ({
      [name]: {
        name,
        value: generateFromSchemaObject(schema, addImport),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        description: (schema as any)['description'],
        required: requiredFields.includes(name),
      },
    }))
    .reduce((acc, current) => {
      for (const key in current) {
        acc[key] = current[key]
      }
      return acc
    }, {})
  return formatProperties(Object.values(properties))
}
