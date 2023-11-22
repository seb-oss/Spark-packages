import { ReferenceObject } from '../shared/schema'

export const parseReferencableObjects = <T extends object>(
  name: string,
  record: Record<string, ReferenceObject | T>
): Record<string, T> => {
  const objects: Record<string, T> = {}

  if (record) {
    const allParameters = Object.entries(record)
    const referenceParameters = allParameters
      .filter((it) => '$ref' in it[1])
      .map((it) => [it[0], it[1]] as [string, ReferenceObject])
    const normalParameters = allParameters
      .filter((it) => !('$ref' in it[1]))
      .map((it) => [it[0], it[1]] as [string, T])

    for (const it of normalParameters) {
      objects[`#/components/${name}/${it[0]}`] = it[1]
    }

    for (const it of referenceParameters) {
      objects[`#/components/${name}/${it[0]}`] = objects[it[1].$ref]
    }
  }

  return objects
}
