export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type NestedPaths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]:
        | `${Prefix}${Prefix extends '' ? '' : '.'}${K}` // Parent nodes
        | NestedPaths<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K}`> // Recursively for nested nodes
    }[keyof T & string]
  : never

// NestedLeafPaths: Returns only leaf nodes, including multi-field sub-fields
export type NestedLeafPaths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends { fields: infer F }
        ? // If this field has sub-fields (multi-field), include them
            | NestedLeafPaths<
                T[K],
                `${Prefix}${Prefix extends '' ? '' : '.'}${K}`
              >
            | NestedLeafPaths<F, `${Prefix}${Prefix extends '' ? '' : '.'}${K}`>
        : // Otherwise traverse normally
          NestedLeafPaths<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K}`>
    }[keyof T & string]
  : Prefix

export type SingleOrArr<T> = T | T[]

/**
 * Autocompletes the literals in `S` but accepts any string. The
 * `Record<never, never>` keeps TypeScript from collapsing the union to
 * `string`, which would lose the suggestions.
 */
export type Suggest<S extends string> = S | (string & Record<never, never>)

/**
 * An object keyed by field paths. Literal paths are optional; pattern paths
 * from dynamic objects (e.g. `meta.${string}`) become an index signature, so
 * the result stays assignable to OpenSearch's `Record<string, V>` types.
 */
export type FieldMap<Keys extends string, V> = {
  [P in Exclude<Keys, PatternKeys<Keys>>]?: V
} & ([PatternKeys<Keys>] extends [never]
  ? unknown
  : { [P in PatternKeys<Keys>]: V })

type PatternKeys<Keys> = Keys extends string
  ? Record<never, never> extends Record<Keys, 1>
    ? Keys
    : never
  : never

export type OneOf<T> = {
  [K in keyof T]: { [P in K]: T[K] } & Partial<
    Record<Exclude<keyof T, K>, never>
  >
}[keyof T]

export type Primitive = string | number | boolean

export type Empty = Record<string, never>

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
