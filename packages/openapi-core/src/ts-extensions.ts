export type Empty = Record<never, never>

export type Serialized<T> = T extends Date
  ? string
  : T extends bigint
    ? string
    : T extends Map<infer K, infer V>
      ? Array<[Serialized<K>, Serialized<V>]>
      : T extends Set<infer V>
        ? Array<Serialized<V>>
        : T extends (infer U)[]
          ? Array<Serialized<U>>
          : T extends object
            ? { [K in keyof T]: Serialized<T[K]> }
            : T

export type PartiallySerialized<T> = {
  [K in keyof T]: T[K] | Serialized<T[K]>
}

// Type helper that converts specific types to strings while preserving string unions
type ConvertToQueryParam<T> =
  // Number to string
  T extends number
    ? string
    : // boolean to string
      T extends boolean
      ? string
      : // date to string
        T extends Date
        ? string
        : // Keep string unions
          T extends string
          ? T // Keep string unions and literals as-is
          : // Recurse on arrays
            T extends Array<infer U>
            ? Array<ConvertToQueryParam<U>>
            : // Recurse on objects
              T extends object
              ? { [K in keyof T]: ConvertToQueryParam<T[K]> }
              : // Everything else is left as is
                T

// Main QueryParams type that applies the conversion
export type QueryParams<T> = {
  [K in keyof T]: ConvertToQueryParam<T[K]>
}

export type LowerCaseHeaders<T> = {
  [P in keyof T as Lowercase<P & string>]: T[P]
}

export type ClientArgs<T> = {
  [P in keyof T as Exclude<P, 'headers'>]: T[P]
} & (T extends { headers?: infer H }
  ? { headers?: LowerCaseHeaders<H> }
  : // biome-ignore lint/complexity/noBannedTypes: helper - not prod code
    {}) &
  // biome-ignore lint/complexity/noBannedTypes: helper - not prod code
  (T extends { headers: infer H } ? { headers: LowerCaseHeaders<H> } : {})
