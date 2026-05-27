# `@sebspark/environment`

Utilities for reading environment variables and secrets in a type-safe, lazy way.

## `initEnvironment<T>()`

Returns a typed proxy that reads from `process.env` on each property access. Required variables are asserted at access time — an error is thrown if the value is missing.

```typescript
import { initEnvironment } from '@sebspark/environment'

type Env = {
  API_URL: string
  PORT: string
}

const env = initEnvironment<Env>()

env.API_URL      // reads process.env.API_URL, throws if missing
env.optional.PORT // reads process.env.PORT, returns undefined if missing
```

Values are cached after the first access.

## `initSecretStore<T>(opts?)`

Returns a typed proxy that reads secrets from the filesystem. Useful for Kubernetes-mounted secrets where each secret is a file named after the key.

```typescript
import { initSecretStore } from '@sebspark/environment'

type Secrets = {
  DB_PASSWORD: string
  API_KEY: string
}

const secrets = initSecretStore<Secrets>({
  dir: '/var/secrets',   // directory containing secret files (optional)
  fallback: true,        // fall back to process.env if file is missing (optional)
})

secrets.DB_PASSWORD // reads /var/secrets/DB_PASSWORD
```

Options:

| Option | Type | Description |
|---|---|---|
| `dir` | `string` | Directory to read secret files from. Defaults to CWD. |
| `fallback` | `boolean \| Partial<T>` | If `true`, falls back to `process.env`. If an object, uses its values as fallback. |

Values are cached after the first access. An error is thrown if the secret cannot be resolved.

## `mergeEnvironments(env, secrets)`

Merges the results of `initEnvironment` and `initSecretStore` into a single typed proxy. Secrets take precedence over environment variables for overlapping keys. Falls back to the environment proxy if a secret is not found.

```typescript
import { initEnvironment, initSecretStore, mergeEnvironments } from '@sebspark/environment'

type Env = { API_URL: string; DB_PASSWORD: string }
type Secrets = { DB_PASSWORD: string }

const env = initEnvironment<Env>()
const secrets = initSecretStore<Secrets>({ dir: '/var/secrets', fallback: true })

export const Environment = mergeEnvironments(env, secrets)

Environment.API_URL     // from process.env
Environment.DB_PASSWORD // from /var/secrets/DB_PASSWORD, falls back to process.env
```
