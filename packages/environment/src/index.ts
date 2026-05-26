import assert from 'node:assert'
import { readFileSync } from 'node:fs'

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

export const initSecretStore = <T extends Record<string, string>>() => {
  const secretCache: Record<string, string | undefined> = {}

  return new Proxy(
    {},
    {
      get(_, k: keyof T | string | symbol) {
        const key = k as string
        if (key in secretCache) {
          return secretCache[key]
        }
        try {
          const value = readFileSync(key, 'utf-8').trim()
          secretCache[key] = value
          return secretCache[key]
        } catch (err) {
          throw new Error(`Secret ${key} is required`)
        }
      },
    }
  ) as T & { [key: string]: string }
}
