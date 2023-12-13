import type {
  ApiResponse,
  Client,
  opensearchtypes,
} from '@opensearch-project/opensearch'
import { Mocked, beforeEach, describe, expect, it, vi } from 'vitest'
import { helper } from './openSearchHelper'
import { DeepPartial, ExcludeId } from './typescriptExtensions'

type Interest = 'Hiking' | 'Poledancing' | 'Yoga'

type Data = {
  id: string
  isTrue: boolean
  user: {
    age: number
    interests: Interest[]
    name: string
  }
}

describe('OpenSearchHelper', () => {
  let client: DeepPartial<Mocked<Client>>
  let searchResponse: DeepPartial<
    ApiResponse<opensearchtypes.SearchResponse<ExcludeId<Data>>, unknown>
  >

  beforeEach(() => {
    searchResponse = {
      body: {
        hits: {
          hits: [],
        },
      },
    }
    client = {
      index: vi.fn().mockResolvedValue({}),
      search: vi.fn().mockImplementation(async () => searchResponse),
    }
  })
  describe('helper', () => {
    it('returns a client', () => {
      expect(helper(client as Client)).to.exist
    })
  })
  describe('typedIndexCreate', () => {
    it('creates an index', async () => {
      const create = vi.fn()
      const exists = vi.fn().mockResolvedValue({ body: false })
      client.indices = { create, exists }

      await helper(client as Client).typedIndexCreate<Data>('data', {
        mappings: {
          properties: {
            user: {
              age: {
                type: 'integer',
              },
              interests: {
                type: 'keyword'
              },
            },
            isTrue: {
              type: 'boolean',
            },
          },
        },
      })

      expect(create).toHaveBeenCalledWith({
        index: 'data',
        body: {
          mappings: {
            properties: {
              isTrue: { type: 'boolean' },
              'user.age': { type: 'integer' },
              'user.interests': { type: 'keyword' },
            },
          },
        },
      })
    })
  })
  describe('typedIndex', () => {
    it('indexes a document', async () => {
      await helper(client as Client).typedIndex<Data>('data', {
        id: 'foo',
        isTrue: true,
        user: {
          age: 42,
          interests: ['Hiking'],
          name: 'Arthur Dent',
        },
      })
      expect(client.index).toHaveBeenCalledWith({
        index: 'data',
        id: 'foo',
        body: {
          isTrue: true,
          user: {
            age: 42,
            interests: ['Hiking'],
            name: 'Arthur Dent',
          },
        },
        refresh: true,
      })
    })
  })
  describe('typedSearch', () => {
    it('performs a search', async () => {
      await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: {
          query: {
            fields: ['isTrue', 'user.name^4', { field: 'user.age' }],
          },
        },
      })
      expect(client.search).toHaveBeenCalledOnce()
    })
    it('returns raw response', async () => {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      searchResponse.body!.hits!.hits = [
        {
          _id: 'foo',
          _source: {
            isTrue: true,
            user: { age: 42, interests: ['Hiking'], name: 'Arthur Dent' },
          },
        },
      ]
      const { response } = await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: { query: {} },
      })
      expect(response).toEqual(searchResponse)
    })
    it('transforms search results', async () => {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      searchResponse.body!.hits!.hits = [
        {
          _id: 'foo',
          _source: {
            isTrue: true,
            user: { age: 42, interests: ['Hiking'], name: 'Arthur Dent' },
          },
        },
      ]
      const { results } = await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: {
          query: {},
        },
      })
      expect(results).toEqual([
        {
          id: 'foo',
          isTrue: true,
          user: { age: 42, interests: ['Hiking'], name: 'Arthur Dent' },
        },
      ])
    })
    it('handles fields', async () => {
      await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: {
          query: {
            fields: ['isTrue', 'user.name^4', { field: 'user.age' }],
          },
        },
      })
      expect(client.search).toHaveBeenCalledWith({
        index: 'data',
        body: {
          query: {
            fields: ['isTrue', 'user.name^4', { field: 'user.age' }],
          },
        },
      })
    })
    it('handles exists', async () => {
      await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: {
          query: {
            exists: { field: 'isTrue' },
          },
        },
      })
      expect(client.search).toHaveBeenCalledWith({
        index: 'data',
        body: {
          query: {
            exists: { field: 'isTrue' },
          },
        },
      })
    })
    it('handles bool', async () => {
      await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: {
          query: {
            bool: {
              must: [{ exists: { field: 'isTrue' } }],
            },
          },
        },
      })
      expect(client.search).toHaveBeenCalledWith({
        index: 'data',
        body: {
          query: {
            bool: {
              must: [{ exists: { field: 'isTrue' } }],
            },
          },
        },
      })
    })
    it('handles term', async () => {
      await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: {
          query: {
            term: {
              'user.name': {
                value: 'Arthur Dent',
              },
            },
          },
        },
      })
      expect(client.search).toHaveBeenCalledWith({
        index: 'data',
        body: {
          query: {
            term: {
              'user.name': {
                value: 'Arthur Dent',
              },
            },
          },
        },
      })
    })
  })
})
