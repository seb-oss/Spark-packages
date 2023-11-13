import { ReferenceObject, SchemaObject } from '../schema'

export const generateImports = (
  schemas: (SchemaObject | ReferenceObject)[],
) => {
  const imports = schemas
    .filter((it) => '$ref' in it)
    .map((it) => it as ReferenceObject)
    .filter((it) => it.$ref.startsWith('#'))
    .map((it) => getImport(it.$ref))

  const importMap = new Map<string, string[]>()
  imports.forEach(([file, objectName]) => {
    const objects = importMap.get(file) || []
    importMap.set(file, [...objects, objectName])
  })
  return importMap
}

const getImport = (refString: string) => {
  const [file, rest] = refString.split('#')
  const objectName = rest.substring(rest.lastIndexOf('/') + 1)

  return [file, objectName] as const
}
