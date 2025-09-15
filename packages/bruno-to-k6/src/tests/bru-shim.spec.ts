import { describe, expect, it, vi } from 'vitest'
import { createBruShim } from '../bru-shim'

describe('createBruShim', () => {
  it('sets and gets env vars', () => {
    const env: Record<string, string> = {}
    const bru = createBruShim({ env })

    bru.setEnvVar('token', 'abc123')
    expect(env.token).toBe('abc123')
    expect(bru.getEnvVar('token')).toBe('abc123')
  })
  it('returns undefined for missing env var', () => {
    const env: Record<string, string> = {}
    const bru = createBruShim({ env })

    expect(bru.getEnvVar('missing')).toBeUndefined()
  })
  it('sets and gets vars of any type', () => {
    const env: Record<string, string> = {}
    const vars: Record<string, unknown> = {}
    const bru = createBruShim({ env, vars })

    bru.setVar('count', 42)
    bru.setVar('payload', { ok: true })
    expect(bru.getVar<number>('count')).toBe(42)
    expect(bru.getVar('payload')).toEqual({ ok: true })
  })
  it('overwrites existing env var values', () => {
    const env: Record<string, string> = { mode: 'old' }
    const bru = createBruShim({ env })

    bru.setEnvVar('mode', 'new')
    expect(env.mode).toBe('new')
  })
  it('mutates the provided vars object by reference', () => {
    const env: Record<string, string> = {}
    const vars: Record<string, unknown> = {}
    const bru = createBruShim({ env, vars })

    bru.setVar('k', 'v')
    expect(vars).toEqual({ k: 'v' })
  })
  it('hasEnvVar and deleteEnvVar work', () => {
    const env: Record<string, string> = {}
    const bru = createBruShim({ env })

    expect(bru.hasEnvVar('x')).toBe(false)
    bru.setEnvVar('x', '1')
    expect(bru.hasEnvVar('x')).toBe(true)
    bru.deleteEnvVar('x')
    expect(bru.hasEnvVar('x')).toBe(false)
    expect(bru.getEnvVar('x')).toBeUndefined()
  })
  it('global / collection / folder vars are exposed', () => {
    const env: Record<string, string> = {}
    const bru = createBruShim({
      env,
      globals: { REGION: 'eu' },
      collectionVars: { ns: 'orders' },
      folderVars: { team: 'core' },
    })

    // can write globals
    bru.setGlobalEnvVar('REGION', 'us')
    expect(bru.getGlobalEnvVar('REGION')).toBe('us')

    // reads collection/folder vars
    expect(bru.getCollectionVar('ns')).toBe('orders')
    expect(bru.getFolderVar('team')).toBe('core')
  })
  it('reads process env via getProcessEnv', () => {
    const key = 'BRU_TEST_KEY'
    const old = process.env[key]
    process.env[key] = 'present'
    const bru = createBruShim({ env: {} })
    expect(bru.getProcessEnv(key)).toBe('present')
    // restore
    if (old === undefined) delete process.env[key]
    else process.env[key] = old
  })
  it('hasVar / deleteVar / deleteAllVars manage runtime vars', () => {
    const vars: Record<string, unknown> = {}
    const bru = createBruShim({ env: {}, vars })

    expect(bru.hasVar('a')).toBe(false)
    bru.setVar('a', 1)
    expect(bru.hasVar('a')).toBe(true)
    expect(bru.getVar('a')).toBe(1)

    bru.deleteVar('a')
    expect(bru.hasVar('a')).toBe(false)
    expect(bru.getVar('a')).toBeUndefined()

    bru.setVar('x', 1)
    bru.setVar('y', 2)
    bru.deleteAllVars()
    expect(Object.keys(vars)).toEqual([])
  })
  it('interpolate resolves {{var}}, {{env.X}}, {{global.X}}, {{folder.X}}, {{collection.X}}', () => {
    const env = { TOKEN: 't-123', email: 'a@b.com' }
    const vars = { id: 7 }
    const bru = createBruShim({
      env,
      vars,
      globals: { region: 'eu' },
      folderVars: { team: 'core' },
      collectionVars: { ns: 'orders' },
    })

    const input =
      'id={{id}} token={{env.TOKEN}} r={{global.region}} f={{folder.team}} c={{collection.ns}} email={{email}}'
    const out = bru.interpolate(input)
    expect(out).toBe('id=7 token=t-123 r=eu f=core c=orders email=a@b.com')
  })
  it('sleep awaits at least the requested duration', async () => {
    vi.useFakeTimers()
    const bru = createBruShim({ env: {} })

    const resolved = vi.fn()
    const p = bru.sleep(50).then(resolved)

    // advance to just before the deadline
    await vi.advanceTimersByTimeAsync(49)
    expect(resolved).not.toHaveBeenCalled()

    // advance the final millisecond
    await vi.advanceTimersByTimeAsync(1)
    await p
    expect(resolved).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })
  it('disableParsingResponseJson toggles flag', () => {
    const bru = createBruShim({ env: {} })
    expect(bru.flags.disableJsonParsing).toBe(false)
    bru.disableParsingResponseJson()
    expect(bru.flags.disableJsonParsing).toBe(true)
  })
  it('setNextRequest stores name and triggers hook', () => {
    const hook = vi.fn()
    const bru = createBruShim({ env: {}, onSetNextRequest: hook })
    bru.setNextRequest('Login')
    expect(bru.flags.nextRequest).toBe('Login')
    expect(hook).toHaveBeenCalledWith('Login')
  })
  it('runRequest delegates to handler and returns its value', async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true })
    const bru = createBruShim({ env: {}, onRunRequest: handler })
    const res = await bru.runRequest('Auth/Token')
    expect(handler).toHaveBeenCalledWith('Auth/Token')
    expect(res).toEqual({ ok: true })
  })
  it('getEnvName / getCollectionName / cwd return provided values', () => {
    const bru = createBruShim({
      env: {},
      envName: 'dev',
      collectionName: 'Depot',
      cwd: '/work',
    })
    expect(bru.getEnvName()).toBe('dev')
    expect(bru.getCollectionName()).toBe('Depot')
    expect(bru.cwd()).toBe('/work')
  })
})
