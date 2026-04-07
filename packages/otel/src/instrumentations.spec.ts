import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@opentelemetry/instrumentation-http', () => ({
  HttpInstrumentation: vi.fn(function (this: any, config?: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-http'
    this._config = config
  }),
}))

vi.mock('@opentelemetry/instrumentation-express', () => ({
  ExpressInstrumentation: vi.fn(function (this: any, config?: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-express'
    this._config = config
  }),
}))

vi.mock('@opentelemetry/instrumentation-grpc', () => ({
  GrpcInstrumentation: vi.fn(function (this: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-grpc'
  }),
}))

vi.mock('@opentelemetry/instrumentation-redis', () => ({
  RedisInstrumentation: vi.fn(function (this: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-redis'
  }),
}))

vi.mock('@opentelemetry/instrumentation-dns', () => ({
  DnsInstrumentation: vi.fn(function (this: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-dns'
  }),
}))

vi.mock('@opentelemetry/instrumentation-net', () => ({
  NetInstrumentation: vi.fn(function (this: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-net'
  }),
}))

vi.mock('@opentelemetry/instrumentation-fs', () => ({
  FsInstrumentation: vi.fn(function (this: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-fs'
  }),
}))

vi.mock('@opentelemetry/instrumentation-undici', () => ({
  UndiciInstrumentation: vi.fn(function (this: any, config?: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-undici'
    this._config = config
  }),
}))

vi.mock('@opentelemetry/instrumentation-socket.io', () => ({
  SocketIoInstrumentation: vi.fn(function (this: any) {
    this.instrumentationName = '@opentelemetry/instrumentation-socket.io'
  }),
}))

vi.mock('@sebspark/opentelemetry-instrumentation-opensearch', () => ({
  OpenSearchInstrumentation: vi.fn(function (this: any) {
    this.instrumentationName =
      '@sebspark/opentelemetry-instrumentation-opensearch'
  }),
}))

describe('instrumentations', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('http', () => {
    it('resolves to an HttpInstrumentation with enrichment hooks', async () => {
      const { instrumentations } = await import('./instrumentations')
      const { HttpInstrumentation } = await import(
        '@opentelemetry/instrumentation-http'
      )

      const inst = await instrumentations.http()

      expect(inst).toBeInstanceOf(HttpInstrumentation)
      expect((inst as any)._config).toMatchObject({
        requestHook: expect.any(Function),
        responseHook: expect.any(Function),
      })
    })

    it('passes config to HttpInstrumentation', async () => {
      const { instrumentations } = await import('./instrumentations')

      const inst = await instrumentations.http({ enabled: false })

      expect((inst as any)._config).toMatchObject({ enabled: false })
    })

    it('returns the same instance for the same config', async () => {
      const { instrumentations } = await import('./instrumentations')

      const inst1 = await instrumentations.http()
      const inst2 = await instrumentations.http()

      expect(inst1).toBe(inst2)
    })

    it('returns different instances for different configs', async () => {
      const { instrumentations } = await import('./instrumentations')

      const inst1 = await instrumentations.http()
      const inst2 = await instrumentations.http({ enabled: false })

      expect(inst1).not.toBe(inst2)
    })
  })

  describe('express', () => {
    it('resolves to an ExpressInstrumentation', async () => {
      const { instrumentations } = await import('./instrumentations')
      const { ExpressInstrumentation } = await import(
        '@opentelemetry/instrumentation-express'
      )

      const inst = await instrumentations.express()

      expect(inst).toBeInstanceOf(ExpressInstrumentation)
    })

    it('passes config to ExpressInstrumentation', async () => {
      const { instrumentations } = await import('./instrumentations')
      const config = { ignoreLayers: ['/health'] }

      const inst = await instrumentations.express(config as any)

      expect((inst as any)._config).toMatchObject(config)
    })

    it('returns the same instance for the same config', async () => {
      const { instrumentations } = await import('./instrumentations')

      const inst1 = await instrumentations.express()
      const inst2 = await instrumentations.express()

      expect(inst1).toBe(inst2)
    })

    it('returns different instances for different configs', async () => {
      const { instrumentations } = await import('./instrumentations')

      const inst1 = await instrumentations.express()
      const inst2 = await instrumentations.express({
        ignoreLayers: ['/health'],
      } as any)

      expect(inst1).not.toBe(inst2)
    })
  })

  it('undici resolves to a UndiciInstrumentation with enrichment hooks', async () => {
    const { instrumentations } = await import('./instrumentations')
    const { UndiciInstrumentation } = await import(
      '@opentelemetry/instrumentation-undici'
    )

    const inst = await instrumentations.undici()

    expect(inst).toBeInstanceOf(UndiciInstrumentation)
    expect((inst as any)._config).toMatchObject({
      requestHook: expect.any(Function),
      responseHook: expect.any(Function),
    })
  })

  it.each([
    ['grpc', '@opentelemetry/instrumentation-grpc'],
    ['redis', '@opentelemetry/instrumentation-redis'],
    ['dns', '@opentelemetry/instrumentation-dns'],
    ['net', '@opentelemetry/instrumentation-net'],
    ['fs', '@opentelemetry/instrumentation-fs'],
    ['socketIo', '@opentelemetry/instrumentation-socket.io'],
    ['opensearch', '@sebspark/opentelemetry-instrumentation-opensearch'],
  ] as const)('%s resolves to the correct instrumentation', async (key, name) => {
    const { instrumentations } = await import('./instrumentations')
    const inst = await instrumentations[key]()
    expect((inst as any).instrumentationName).toBe(name)
  })
})
