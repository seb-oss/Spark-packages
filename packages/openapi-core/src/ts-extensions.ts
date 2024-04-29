export type Empty = Record<never, never>

// For each property P in T
type Serialized<T> = {
  // Convert Date to string
  [P in keyof T]: T[P] extends Date
    ? string
    : // Convert Date | undefined to string | undefined
      T[P] extends Date | undefined
      ? string | undefined
      : // Recursively serialize array elements
        T[P] extends Array<infer U>
        ? Array<Serialized<U>>
        : // Functions are not serialized, so keep them as is
          // biome-ignore lint/suspicious/noExplicitAny: Function type
          T[P] extends (...args: any) => any
          ? T[P]
          : // Recursively serialize nested objects
            T[P] extends object
            ? Serialized<T[P]>
            : // Recursively serialize nested objects | undefined
              T[P] extends object | undefined
              ? Serialized<NonNullable<T[P]>> | undefined
              : // Leave primitives and serializable types as is
                T[P]
}

export type PartiallySerialized<T> = T | Serialized<T>

export type LowerCaseHeaders<T> = {
  [P in keyof T as Lowercase<P & string>]: T[P]
}

export type ClientArgs<T> = {
  [P in keyof T as Exclude<P, 'headers'>]: T[P]
} & (T extends { headers?: infer H }
  ? { headers?: LowerCaseHeaders<H> }
  : // biome-ignore lint/complexity/noBannedTypes: <explanation>
    {}) &
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  (T extends { headers: infer H } ? { headers: LowerCaseHeaders<H> } : {})
