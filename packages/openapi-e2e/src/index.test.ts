import type { Server } from 'node:http'
import { TypedClient } from '@sebspark/openapi-client'
import type { Serialized } from '@sebspark/openapi-core'
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest'
import type {
  InstrumentEntityResponse,
  MarketdataClient,
} from './schemas/marketdata'
import { app, markets } from './server'

describe('openapi e2e tests', () => {
  const PORT = 12345
  let server: Server
  let client: MarketdataClient

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve())
      client = TypedClient<MarketdataClient>(`http://localhost:${PORT}`)
    })
  })

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err)
          else resolve()
        })
      })
  )

  it('returns markets', async () => {
    const result = await client.get('/markets')
    expect(result.data).toEqual(markets)
  })

  it('works for multiple parameter urls', async () => {
    const result = await client.get(
      '/markets/:mic/instruments/:isin/:currency',
      { params: { mic: 'XSTO', isin: 'SE1234567', currency: 'SEK' } }
    )
    expect(result.data).toEqual<Serialized<InstrumentEntityResponse>>({
      data: {
        id: 'xsto_se1234567_sek',
        mic: 'XSTO',
        isin: 'SE1234567',
        currency: 'SEK',
        lastValidDate: '2024-02-05',
        lastValidDateTime: '2024-02-05T13:05:02.000Z',
      },
      links: {
        self: '/markets/xsto/instruments/se1234567/sek',
      },
    })
  })

  it('sends headers', async () => {
    const result = await client.get('/secured', {
      headers: { 'X-Api-Key': 'yo!', 'X-Client-Key': 'Hello' },
    })
    expect(result.data).toEqual('ok')
  })

  describe('authorizationTokenGenerators are unique per instance', () => {
    let clientOne: MarketdataClient
    let clientTwo: MarketdataClient

    let authorizationTokenGeneratorOne: Mock<
      (url: string) => Promise<Record<string, string>> | undefined
    >
    let authorizationTokenGeneratorTwo: Mock<
      (url: string) => Promise<Record<string, string>> | undefined
    >

    beforeAll(async () => {
      authorizationTokenGeneratorOne = vi.fn().mockResolvedValue({
        'x-test-value': 'one',
      })

      authorizationTokenGeneratorTwo = vi.fn().mockResolvedValue({
        'x-test-value': 'two',
      })

      clientOne = TypedClient<MarketdataClient>(`http://localhost:${PORT}`, {
        authorizationTokenGenerator: authorizationTokenGeneratorOne,
      })
      clientTwo = TypedClient<MarketdataClient>(`http://localhost:${PORT}`, {
        authorizationTokenGenerator: authorizationTokenGeneratorTwo,
      })
    })

    it('calls the server with the correct authorization token', async () => {
      const resultOne = await clientOne.get('/header/extract')
      expect(resultOne.data).toEqual('one')
      expect(authorizationTokenGeneratorOne).toHaveBeenCalledWith(
        `http://localhost:${PORT}/header/extract`
      )

      const resultTwo = await clientTwo.get('/header/extract')
      expect(resultTwo.data).toEqual('two')
      expect(authorizationTokenGeneratorTwo).toHaveBeenCalledWith(
        `http://localhost:${PORT}/header/extract`
      )
    })
  })
})
