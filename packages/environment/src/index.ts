import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const initEnvironment = <T extends Record<string, string>>() => {
  const environmentCache: Record<string, string | undefined> = {}

  // biome-ignore lint/plugin/no-type-assertion: the Proxy resolves keys from process.env at runtime; this is the typed surface it implements
  return new Proxy(
    {},
    {
      get(_, key) {
        if (typeof key !== 'string') return undefined
        if (key === 'optional') {
          // biome-ignore lint/plugin/no-type-assertion: the Proxy resolves keys from process.env at runtime; this is the typed surface it implements
          return new Proxy(
            {},
            {
              get(_, key) {
                if (typeof key !== 'string') return undefined
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

export const mergeEnvironments = <
  T extends Record<string, string>,
  U extends Record<string, string>,
>(
  env: T,
  secrets: U
): T & U =>
  // biome-ignore lint/plugin/no-type-assertion: the Proxy delegates every key to secrets or env at runtime; this is the typed surface it implements
  new Proxy({} as T & U, {
    get(_, key) {
      if (typeof key !== 'string') return undefined
      try {
        return secrets[key]
      } catch {
        return env[key]
      }
    },
  })

type SecretStoreOptions<T> = {
  dir?: string
  fallback?: boolean | Partial<T>
}

export const initSecretStore = <T extends Record<string, string>>(
  opts?: SecretStoreOptions<T>
) => {
  const secretCache: Record<string, string | undefined> = {}
  const { dir, fallback } = opts ?? {}

  // biome-ignore lint/plugin/no-type-assertion: the Proxy resolves keys from files or fallbacks at runtime; this is the typed surface it implements
  return new Proxy(
    {},
    {
      get(_, key) {
        if (typeof key !== 'string') return undefined
        if (key in secretCache) {
          return secretCache[key]
        }

        // 1. Try reading from file (dir/KEY or just KEY if no dir)
        const filePath = dir ? join(dir, key) : key
        try {
          const value = readFileSync(filePath, 'utf-8').trim()
          secretCache[key] = value
          return secretCache[key]
        } catch {
          // file not found — continue to fallback
        }

        // 2. Try fallback
        if (fallback === true) {
          // auto-read from process.env using the same key name
          const { [key]: value } = process.env
          if (value !== undefined) {
            secretCache[key] = value
            return secretCache[key]
          }
        } else if (fallback) {
          const value = fallback[key]
          if (value !== undefined) {
            secretCache[key] = value
            return secretCache[key]
          }
        }

        throw new Error(`Secret ${key} is required`)
      },
    }
  ) as T & { [key: string]: string }
}
