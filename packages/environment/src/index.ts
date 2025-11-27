import assert from 'node:assert'

export const initEnvironment = <T extends Record<string, string>>() => {
  const environmentCache: Record<string, string | undefined> = {}

  return new Proxy(
    {},
    {
      get(_, k: keyof T | 'optional' | string | symbol) {
        const key = k as string
        if (key === 'optional') {
          return new Proxy(
            {},
            {
              get(_, k: keyof T | string | symbol) {
                const key = k as string
                if (key in environmentCache) {
                  return environmentCache[key]
                }
                const { [key]: value } = process.env
                environmentCache[key] = value
                return environmentCache[key]
              },
            }
          ) as T
        }
        if (key in environmentCache) {
          return environmentCache[key]
        }
        const { [key]: value } = process.env
        assert(value, `${key} is required`)
        environmentCache[key] = value
        return environmentCache[key]
      },
    }
  ) as T & { optional: Partial<T> } & { [key: string]: string }
}
