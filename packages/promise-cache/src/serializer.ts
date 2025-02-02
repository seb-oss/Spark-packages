// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const fixESM = require('fix-esm')
import type SuperJSON from 'superjson'
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
const superjson: SuperJSON = fixESM.require('superjson')

export const serialize = <T>(data: T): string => {
  return superjson.stringify(data)
}

export const deserialize = <T>(serialized: string | null): T | null => {
  if (serialized === undefined || serialized === null) return serialized

  return superjson.parse<T>(serialized)
}
