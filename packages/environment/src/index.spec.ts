import * as fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { initEnvironment, initSecretStore, mergeEnvironments } from './index'

describe('initEnvironment', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns a required env var that is set', () => {
    process.env.MY_VAR = 'hello'
    const env = initEnvironment<{ MY_VAR: string }>()
    expect(env.MY_VAR).toBe('hello')
  })

  it('throws when a required env var is missing', () => {
    delete process.env.MISSING_VAR
    const env = initEnvironment<{ MISSING_VAR: string }>()
    expect(() => env.MISSING_VAR).toThrow('MISSING_VAR is required')
  })

  it('caches the required env var value after first access', () => {
    process.env.CACHED_VAR = 'first'
    const env = initEnvironment<{ CACHED_VAR: string }>()
    expect(env.CACHED_VAR).toBe('first')
    process.env.CACHED_VAR = 'changed'
    expect(env.CACHED_VAR).toBe('first')
  })

  it('returns undefined for a missing optional env var', () => {
    delete process.env.OPT_VAR
    const env = initEnvironment<{ OPT_VAR: string }>()
    expect(env.optional.OPT_VAR).toBeUndefined()
  })

  it('returns the value for a present optional env var', () => {
    process.env.OPT_VAR = 'present'
    const env = initEnvironment<{ OPT_VAR: string }>()
    expect(env.optional.OPT_VAR).toBe('present')
  })

  it('caches the optional env var value after first access', () => {
    process.env.OPT_CACHED = 'first'
    const env = initEnvironment<{ OPT_CACHED: string }>()
    expect(env.optional.OPT_CACHED).toBe('first')
    process.env.OPT_CACHED = 'changed'
    expect(env.optional.OPT_CACHED).toBe('first')
  })
})

describe('mergeEnvironments', () => {
  const secretsDir = fs.mkdtempSync('/tmp/secrets-merge-')
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    for (const file of fs.readdirSync(secretsDir)) {
      fs.unlinkSync(`${secretsDir}/${file}`)
    }
  })

  it('reads from env when key is not in secrets', () => {
    process.env.MY_VAR = 'from-env'
    const env = initEnvironment<{ MY_VAR: string }>()
    const secrets = initSecretStore<Record<never, string>>({ dir: secretsDir })
    const merged = mergeEnvironments(env, secrets)
    expect(merged.MY_VAR).toBe('from-env')
  })

  it('prefers secrets over env for overlapping keys', () => {
    process.env.API_KEY = 'from-env'
    fs.writeFileSync(`${secretsDir}/API_KEY`, 'from-secret')
    const env = initEnvironment<{ API_KEY: string }>()
    const secrets = initSecretStore<{ API_KEY: string }>({ dir: secretsDir })
    const merged = mergeEnvironments(env, secrets)
    expect(merged.API_KEY).toBe('from-secret')
  })

  it('falls back to env when secret file is missing', () => {
    process.env.API_KEY = 'from-env'
    const env = initEnvironment<{ API_KEY: string }>()
    const secrets = initSecretStore<{ API_KEY: string }>({ dir: secretsDir })
    const merged = mergeEnvironments(env, secrets)
    expect(merged.API_KEY).toBe('from-env')
  })
})

describe('initSecretStore', () => {
  const secretsDir = fs.mkdtempSync('/tmp/secrets-')

  beforeEach(() => {
    fs.writeFileSync(`${secretsDir}/GATEWAY_API_KEY`, 'secret')
    fs.writeFileSync(`${secretsDir}/REDIS_PASSWORD`, 'secret2')
    fs.writeFileSync(`${secretsDir}/CACHED_SECRET`, 'first')
  })

  afterEach(() => {
    for (const file of fs.readdirSync(secretsDir)) {
      fs.unlinkSync(`${secretsDir}/${file}`)
    }
  })

  it('reads secrets from the given dir', () => {
    const secretStore = initSecretStore<{
      GATEWAY_API_KEY: string
      REDIS_PASSWORD: string
    }>({ dir: secretsDir })
    expect(secretStore.GATEWAY_API_KEY).toBe('secret')
    expect(secretStore.REDIS_PASSWORD).toBe('secret2')
  })

  it('throws when a required secret is missing and there is no fallback', () => {
    fs.unlinkSync(`${secretsDir}/GATEWAY_API_KEY`)
    const secretStore = initSecretStore<{ GATEWAY_API_KEY: string }>({
      dir: secretsDir,
    })
    expect(() => secretStore.GATEWAY_API_KEY).toThrow(
      'Secret GATEWAY_API_KEY is required'
    )
  })

  it('falls back to the fallback object when the file is missing', () => {
    fs.unlinkSync(`${secretsDir}/GATEWAY_API_KEY`)
    const secretStore = initSecretStore<{ GATEWAY_API_KEY: string }>({
      dir: secretsDir,
      fallback: { GATEWAY_API_KEY: 'from-env' },
    })
    expect(secretStore.GATEWAY_API_KEY).toBe('from-env')
  })

  it('prefers the file over the fallback when both are present', () => {
    const secretStore = initSecretStore<{ GATEWAY_API_KEY: string }>({
      dir: secretsDir,
      fallback: { GATEWAY_API_KEY: 'from-env' },
    })
    expect(secretStore.GATEWAY_API_KEY).toBe('secret')
  })

  it('throws when both the file and fallback are missing', () => {
    fs.unlinkSync(`${secretsDir}/GATEWAY_API_KEY`)
    const secretStore = initSecretStore<{ GATEWAY_API_KEY: string }>({
      dir: secretsDir,
      fallback: {},
    })
    expect(() => secretStore.GATEWAY_API_KEY).toThrow(
      'Secret GATEWAY_API_KEY is required'
    )
  })

  it('caches the secret value after first access', () => {
    const secretStore = initSecretStore<{ CACHED_SECRET: string }>({
      dir: secretsDir,
    })
    expect(secretStore.CACHED_SECRET).toBe('first')
    fs.writeFileSync(`${secretsDir}/CACHED_SECRET`, 'changed')
    expect(secretStore.CACHED_SECRET).toBe('first')
  })

  it('works without any options (reads from CWD by key name)', () => {
    fs.writeFileSync('BARE_SECRET', 'bare')
    try {
      const secretStore = initSecretStore<{ BARE_SECRET: string }>()
      expect(secretStore.BARE_SECRET).toBe('bare')
    } finally {
      fs.unlinkSync('BARE_SECRET')
    }
  })

  describe('fallback: true', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('falls back to process.env when the file is missing', () => {
      fs.unlinkSync(`${secretsDir}/GATEWAY_API_KEY`)
      process.env.GATEWAY_API_KEY = 'from-process-env'
      const secretStore = initSecretStore<{ GATEWAY_API_KEY: string }>({
        dir: secretsDir,
        fallback: true,
      })
      expect(secretStore.GATEWAY_API_KEY).toBe('from-process-env')
    })

    it('prefers the file over process.env when both are present', () => {
      process.env.GATEWAY_API_KEY = 'from-process-env'
      const secretStore = initSecretStore<{ GATEWAY_API_KEY: string }>({
        dir: secretsDir,
        fallback: true,
      })
      expect(secretStore.GATEWAY_API_KEY).toBe('secret')
    })

    it('throws when both the file and process.env are missing', () => {
      fs.unlinkSync(`${secretsDir}/GATEWAY_API_KEY`)
      delete process.env.GATEWAY_API_KEY
      const secretStore = initSecretStore<{ GATEWAY_API_KEY: string }>({
        dir: secretsDir,
        fallback: true,
      })
      expect(() => secretStore.GATEWAY_API_KEY).toThrow(
        'Secret GATEWAY_API_KEY is required'
      )
    })
  })
})
