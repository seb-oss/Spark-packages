import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { initEnvironment } from './index'

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
