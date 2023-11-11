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

    normalParameters.forEach((it) => {
      objects[`#/components/${name}/${it[0]}`] = it[1]
    })

    referenceParameters.forEach((it) => {
      objects[`#/components/${name}/${it[0]}`] = objects[it[1].$ref]
    })
  }

  return objects
}
