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

// NestedLeafPaths: Returns only leaf nodes
export type NestedLeafPaths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: NestedLeafPaths<
        T[K],
        `${Prefix}${Prefix extends '' ? '' : '.'}${K}`
      >
    }[keyof T & string]
  : Prefix

export type SingleOrArr<T> = T | T[]

export type OneOf<T> = {
  [K in keyof T]: { [P in K]: T[K] } & Partial<
    Record<Exclude<keyof T, K>, never>
  >
}[keyof T]

export type Primitive = string | number | boolean

export type Empty = Record<string, never>
