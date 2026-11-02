import { describe, expectTypeOf, test } from 'vitest'
import type { APIResponse, BaseClient } from './types'

describe('BaseClient', () => {
  test('a generated overload with a union url wins over the generic signature', () => {
    type Client = Pick<BaseClient, 'post'> & {
      post: {
        (
          url: '/graphql/' | '/graphql',
          args?: { body?: { query?: string } }
        ): Promise<APIResponse<{ data: string }>>
      }
    }
    const call = async (client: Client) =>
      (await client.post('/graphql', { body: { query: 'q' } })).data

    expectTypeOf(call).returns.resolves.toEqualTypeOf<{ data: string }>()
  })

  test('a generated overload with a single url wins over the generic signature', () => {
    type Client = Pick<BaseClient, 'get'> & {
      get: {
        (
          url: '/items',
          args?: { query?: { limit?: string } }
        ): Promise<APIResponse<string[]>>
      }
    }
    const call = async (client: Client) =>
      (await client.get('/items', { query: { limit: '1' } })).data

    expectTypeOf(call).returns.resolves.toEqualTypeOf<string[]>()
  })
})
