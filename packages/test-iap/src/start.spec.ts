import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest'
import { createProxyServer } from './server'

const listenMock = vi.fn((port: number, cb?: () => void) => cb?.())
vi.mock('./server', () => ({
  createProxyServer: vi.fn(() => ({ listen: listenMock })),
}))

const setEnv = (env: Record<string, string | undefined>) => {
  // nuke only the vars we care about so PATH etc. survive
  delete process.env.TARGET
  delete process.env.MODE
  delete process.env.DOWNSTREAM
  delete process.env.PORT

  for (const [k, v] of Object.entries(env)) {
    if (v !== undefined) process.env[k] = v
  }
}

describe('start.ts bootstrap', () => {
  let logSpy: Mock

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('starts in local mode by default when DOWNSTREAM is not set', async () => {
    setEnv({ TARGET: 'http://core:3000', PORT: '4567' })

    await import('./start.js')

    // createProxyServer called with inferred local mode
    expect(createProxyServer).toHaveBeenCalledTimes(1)
    const cfg = (createProxyServer as any).mock.calls[0][0]
    expect(cfg).toEqual({
      target: 'http://core:3000/',
      mode: 'local',
      downstream: '',
    })

    // listened on PORT
    expect(listenMock).lastCalledWith(4567, expect.any(Function))
    // logged something helpful
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('IAP listening on :4567')
    )
  })

  it('infers downstream mode when DOWNSTREAM is set and MODE is unset', async () => {
    setEnv({
      TARGET: 'http://core:3000',
      DOWNSTREAM: 'https://issuer.example/api/token',
    })

    await import('./start.js')

    expect(createProxyServer).toHaveBeenCalledTimes(1)
    const cfg = (createProxyServer as any).mock.calls[0][0]
    expect(cfg).toEqual({
      target: 'http://core:3000/',
      mode: 'downstream',
      downstream: 'https://issuer.example/api/token',
    })

    // default port 3000
    expect(listenMock).lastCalledWith(3000, expect.any(Function))
  })

  it('honors explicit MODE=local even if DOWNSTREAM is set (but unused)', async () => {
    setEnv({
      TARGET: 'https://api.example.com',
      MODE: 'local',
      DOWNSTREAM: 'https://issuer.example/api/token',
      PORT: '8080',
    })

    await import('./start.js')

    const cfg = (createProxyServer as any).mock.calls[0][0]
    expect(cfg.mode).toBe('local')
    expect(cfg.downstream).toBe('') // your start.ts sets '' when mode is local
    expect(listenMock).lastCalledWith(8080, expect.any(Function))
  })

  it('throws if MODE=downstream but DOWNSTREAM is missing', async () => {
    setEnv({ TARGET: 'http://core:3000', MODE: 'downstream' })

    await expect(import('./start.js')).rejects.toThrow(
      /DOWNSTREAM must be set when MODE=downstream/i
    )
    expect(createProxyServer).not.toHaveBeenCalled()
  })

  it('throws if TARGET is missing', async () => {
    setEnv({})

    await expect(import('./start.js')).rejects.toThrow(/TARGET must be set/i)
    expect(createProxyServer).not.toHaveBeenCalled()
  })

  it('throws if TARGET has unsupported protocol', async () => {
    setEnv({ TARGET: 'ftp://example.com' })

    await expect(import('./start.js')).rejects.toThrow(
      /TARGET must start with http/i
    )
    expect(createProxyServer).not.toHaveBeenCalled()
  })

  it('throws if DOWNSTREAM has unsupported protocol', async () => {
    setEnv({
      TARGET: 'http://core:3000',
      MODE: 'downstream',
      DOWNSTREAM: 'ws://issuer.example/api/token',
    })

    await expect(import('./start.js')).rejects.toThrow(
      /DOWNSTREAM must be an absolute URL/i
    )
    expect(createProxyServer).not.toHaveBeenCalled()
  })

  it('defaults PORT to 3000 when PORT is not a number', async () => {
    setEnv({ TARGET: 'http://core:3000', PORT: 'nope' })

    await import('./start.js')

    expect(listenMock).lastCalledWith(3000, expect.any(Function))
  })
})
