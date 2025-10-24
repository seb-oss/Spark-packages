import superjson from 'superjson'

export const serialize = <T>(data: T): string => {
  return superjson.stringify(data)
}

export const deserialize = <T>(serialized: string | null): T | null => {
  if (serialized === undefined || serialized === null) return serialized

  return superjson.parse<T>(serialized)
}
