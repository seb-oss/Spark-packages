export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P]
}

// Support for nester properties where { a: { b: 1 } } is expressed as 'a.b'
export type NestedFields<T> = {
  [P in keyof T]?: T[P] extends object ? NestedFields<T[P]> : T[P]
}

export type NestedPaths<T> = T extends object 
  ? { [K in keyof T]: T[K] extends string | number | boolean | Date
      ? K 
      : T[K] extends object ? `${K & string}.${NestedPaths<T[K]> & string}` : never 
    }[keyof T] 
  : never

/*export type NestedStringPaths<T> = T extends object 
  ? { [K in keyof T]: T[K] extends string 
      ? K 
      : T[K] extends object ? `${K & string}.${NestedStringPaths<T[K]> & string}` : never 
    }[keyof T] 
  : never*/

export type NestedStringPaths<T, Prefix extends string = ''> = 
  T extends object
    ? { [K in keyof T & string]: NestedStringPaths<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K}`> }[keyof T & string]
    : Prefix

export type NestedNumberPaths<T> = T extends object 
  ? { [K in keyof T]: T[K] extends number 
      ? K 
      : T[K] extends object ? `${K & string}.${NestedNumberPaths<T[K]> & string}` : never 
    }[keyof T] 
  : never

export type Primitive = string | number | boolean | Date

export type WithId = {
  id: string
}
export type ExcludeId<T> = Omit<T, 'id'>

// Type for building field paths as strings
export type FieldPath<T, Prefix extends string = ''> = T extends Primitive | Array<Primitive> ? never
  : {
      [K in keyof T]-?: `${Prefix}${K & string}` | (T[K] extends Primitive | Array<Primitive> ? never : `${Prefix}${K & string}.*`)
    }[keyof T]

export type SubstringOf<T extends string> = T extends `${infer Prefix}${infer _Rest}` ? Prefix | SubstringOf<Exclude<T, Prefix>> : never
