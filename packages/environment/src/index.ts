import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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

type SecretStoreOptions<T> = {
  dir?: string
  fallback?: boolean | Partial<T>
}

export const initSecretStore = <T extends Record<string, string>>(
  opts?: SecretStoreOptions<T>
) => {
  const secretCache: Record<string, string | undefined> = {}
  const { dir, fallback } = opts ?? {}

  return new Proxy(
    {},
    {
      get(_, k: keyof T | string | symbol) {
        const key = k as string
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
        } else if (fallback && key in fallback) {
          secretCache[key] = fallback[key as keyof T] as string
          return secretCache[key]
        }

        throw new Error(`Secret ${key} is required`)
      },
    }
  ) as T & { [key: string]: string }
}
