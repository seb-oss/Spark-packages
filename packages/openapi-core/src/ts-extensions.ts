export type Empty = Record<never, never>

export type Serialized<T> = {
  [P in keyof T]: T[P] extends Date
    ? string // Convert Date to string
    : T[P] extends Array<infer U>
      ? Array<Serialized<U>> // Recursively serialize array elements
      : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        T[P] extends (...args: any) => any
        ? T[P] // Functions are not serialized, so keep them as is
        : T[P] extends object
          ? Serialized<T[P]> // Recursively serialize nested objects
          : T[P] // Leave primitives and serializable types as is
}

export type PartiallySerialized<T> = T | Serialized<T>

export type LowerCaseHeaders<T> = {
  [P in keyof T as Lowercase<P & string>]: T[P]
}

export type ClientArgs<T> = {
  [P in keyof T as Exclude<P, 'headers'>]: T[P]
} & (T extends { headers?: infer H }
  ? // biome-ignore lint/complexity/noBannedTypes: <explanation>
    { headers?: LowerCaseHeaders<H> }
  : {}) &
  (T extends { headers: infer H } ? { headers: LowerCaseHeaders<H> } : {})
