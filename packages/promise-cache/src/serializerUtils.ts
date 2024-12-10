type Serialized =
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'undefined' }
  | { type: 'bigint'; value: string }
  | { type: 'null' }
  | { type: 'array'; value: Serialized[] }
  | { type: 'map'; value: [Serialized, Serialized][] }
  | { type: 'set'; value: Serialized[] }
  | { type: 'object'; value: Record<string, Serialized> }

type Serializable =
  | string
  | number
  | boolean
  | undefined
  | null
  | bigint
  | Serializable[]
  | Map<Serializable, Serializable>
  | Set<Serializable>
  | { [key: string]: Serializable }

/**
 * Serialize a value to a string.
 * @param value Serializable
 * @returns serialized string
 */
export function serialize<T>(value: T): string {
  const type = typeof value

  if (value === null) {
    return JSON.stringify({ type: 'null' })
  }

  if (value === undefined) {
    return JSON.stringify({ type: 'undefined' })
  }

  switch (type) {
    case 'string':
    case 'number':
    case 'boolean':
      return JSON.stringify({ type, value })
    case 'bigint':
      return JSON.stringify({ type: 'bigint', value: value.toString() })
    case 'object': {
      if (Array.isArray(value)) {
        return JSON.stringify({ type: 'array', value: value.map(serialize) })
      } 

      if (value instanceof Map) {
        const entries = Array.from(value.entries()).map(([key, val]) => [
          serialize(key),
          serialize(val),
        ])
        return JSON.stringify({ type: 'map', value: entries })
      }

      if (value instanceof Set) {
        const entries = Array.from(value).map(serialize)
        return JSON.stringify({ type: 'set', value: entries })
      }

      if (value.constructor === Object) {
        const entries = Object.entries(value).reduce(
          (acc, [key, val]) => {
            acc[key] = serialize(val)
            return acc
          },
          {} as Record<string, string>
        )

        return JSON.stringify({ type: 'object', value: entries })
      } 

      throw new Error('Cannot serialize non-plain objects')

    }
    default:
      throw new Error(`Unsupported type: ${type}`)
  }
}

/**
 * Deserialize primitive values from a serialized string.
 * @param serialized The serialized primitive value.
 * @returns The deserialized primitive value.
 * @throws {Error} If the serialized value has an unsupported type.
 */
function deserializePrimitives(serialized: Serialized): Serializable {
  let parsed: Serialized = serialized
  if (typeof serialized === 'string') {
    parsed = JSON.parse(serialized) as Serialized
  }
  switch (parsed.type) {
    case 'string':
      return parsed.value
    case 'number':
      return Number(parsed.value)
    case 'boolean':
      return Boolean(parsed.value)
    case 'undefined':
      return undefined
    case 'bigint':
      return BigInt(parsed.value)
    case 'null':
      return null
    default:
      throw new Error(`Unsupported type during deserialization: ${parsed.type}`)
  }
}

/**
 * Deserialize a value from a string.
 * @param serialized string to deserialize
 * @returns deserialized value
 */
export function deserialize(serialized: Serialized): Serializable {
  let parsed: Serialized = serialized
  if (typeof serialized === 'string') {
    parsed = JSON.parse(serialized) as Serialized
  }

  switch (parsed.type) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
    case 'bigint':
    case 'null':
      return deserializePrimitives(parsed)
    case 'array':
      return parsed.value.map(deserializePrimitives)
    case 'map': {
      const map = new Map<Serializable, Serializable>()

      for (const [key, val] of parsed.value) {
        map.set(deserializePrimitives(key), deserializePrimitives(val))
      }
      return map
    }
    case 'set': {
      const set = new Set<Serializable>()

      for (const item of parsed.value) {
        set.add(deserialize(item))
      }
      return set
    }
    case 'object': {
      const obj: Record<string, Serializable> = {}
      for (const [key, val] of Object.entries(parsed.value)) {
        obj[key] = deserialize(val)
      }
      return obj
    }
    default:
      throw new Error(`Unsupported type during deserialization: ${parsed}`)
  }
}
