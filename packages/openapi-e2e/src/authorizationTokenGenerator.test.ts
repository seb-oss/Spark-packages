import type { Server } from 'node:http'
import { TypedClient } from '@sebspark/openapi-client'
import {
  type Mock,
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import type { MarketdataClient } from './schemas/marketdata'
import { app } from './server'

describe('openapi client authorization token generator', () => {
  const PORT = 12345
  let server: Server

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

    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => resolve())
      clientOne = TypedClient<MarketdataClient>(`http://localhost:${PORT}`, {
        authorizationTokenGenerator: authorizationTokenGeneratorOne,
      })
      clientTwo = TypedClient<MarketdataClient>(`http://localhost:${PORT}`, {
        authorizationTokenGenerator: authorizationTokenGeneratorTwo,
      })
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

  it('calls the server with the correct authorization token', async () => {
    const resultOne = await clientOne.get('/header/extract')
    expect(resultOne.data).toEqual('one')
    expect(authorizationTokenGeneratorOne).toHaveBeenCalledWith(
      'http://localhost:12345/header/extract'
    )

    const resultTwo = await clientTwo.get('/header/extract')
    expect(resultTwo.data).toEqual('two')
    expect(authorizationTokenGeneratorTwo).toHaveBeenCalledWith(
      'http://localhost:12345/header/extract'
    )
  })
})
