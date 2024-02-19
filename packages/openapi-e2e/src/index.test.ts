import type { Server } from 'http'
import { TypedClient } from '@sebspark/openapi-client'
import { Serialized } from '@sebspark/openapi-core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  InstrumentEntityResponse,
  MarketdataClient,
} from './schemas/Marketdata'
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
})
