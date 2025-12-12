import {
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  type MockedFunction,
  vi,
} from 'vitest'
import * as clientModule from '../client'
import { GatewayGraphqlClient } from './index'
import type { GatewayGraphqlClientArgs } from './types'

vi.mock('../client', () => ({
  TypedClient: vi.fn(),
}))

const TypedClient = clientModule.TypedClient as Mock<
  typeof clientModule.TypedClient
>

describe('GatewayGraphqlClient', () => {
  const apiKey = 'apiKey'
  const uri = 'https://uri'

  let args: GatewayGraphqlClientArgs
  let typedClient: {
    get: MockedFunction<(path: string) => Promise<any>>
    post: MockedFunction<
      (
        path: string,
        opts: { body: { query: string; variables?: unknown } }
      ) => Promise<any>
    >
  }

  beforeEach(() => {
    vi.clearAllMocks()

    args = {
      apiKey,
      uri,
    }

    typedClient = {
      get: vi.fn(),
      post: vi.fn(),
    }
    TypedClient.mockReturnValue(
      typedClient as unknown as ReturnType<typeof TypedClient>
    )
  })

  describe('constructor', () => {
    it('creates a TypedClient with the correct args', () => {
      new GatewayGraphqlClient(args)

      expect(TypedClient).toHaveBeenCalledOnce()
      expect(TypedClient).toHaveBeenCalledWith(
        uri,
        expect.objectContaining({
          headers: {
            'x-api-key': apiKey,
          },
        })
      )
    })
  })
  describe('graphql method', () => {
    it('returns data on successful response without errors', async () => {
      const data = { foo: 'bar' }
      typedClient.post.mockResolvedValue({ data: { data } })
      const client = new GatewayGraphqlClient(args)

      const result = await client.graphql<typeof data>('query', { id: 1 })
      expect(result).toEqual(data)
      expect(typedClient.post).toHaveBeenCalledWith(
        '/graphql',
        expect.objectContaining({
          body: { query: 'query', variables: { id: 1 } },
        })
      )
    })

    it('throws combined error messages and logs when response contains errors', async () => {
      const errors = [{ message: 'err1' }, { message: 'err2' }]
      typedClient.post.mockResolvedValue({ data: { errors } })
      const client = new GatewayGraphqlClient(args)

      await expect(client.graphql('query')).rejects.toThrow('err1\nerr2')
    })

    it('logs and rethrows when client.post throws', async () => {
      const networkError = new Error('network fail')
      typedClient.post.mockRejectedValue(networkError)
      const client = new GatewayGraphqlClient(args)

      await expect(client.graphql('query')).rejects.toThrow(networkError)
    })

    it('trims query string before sending', async () => {
      typedClient.post.mockResolvedValue({ data: { data: {} } })
      const client = new GatewayGraphqlClient(args)

      await client.graphql('  { a }  ')
      expect(typedClient.post).toHaveBeenCalledWith(
        '/graphql',
        expect.objectContaining({
          body: { query: '{ a }', variables: undefined },
        })
      )
    })
  })
  describe('isHealthy method', () => {
    it('returns true when health check succeeds', async () => {
      typedClient.get.mockResolvedValue({})
      const client = new GatewayGraphqlClient(args)
      const healthy = await client.isHealthy()
      expect(healthy).toBe(true)
      expect(typedClient.get).toHaveBeenCalledWith('/health')
    })

    it('returns false and logs error when health check fails', async () => {
      const err = new Error('down')
      typedClient.get.mockRejectedValue(err)
      const client = new GatewayGraphqlClient(args)
      const healthy = await client.isHealthy()
      expect(healthy).toBe(false)
      expect(typedClient.get).toHaveBeenCalledWith('/health')
    })
  })
})
