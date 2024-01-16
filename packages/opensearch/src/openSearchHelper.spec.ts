import type {
  ApiResponse,
  Client,
  opensearchtypes,
} from '@opensearch-project/opensearch'
import { Mocked, beforeEach, describe, expect, it, vi } from 'vitest'
import { helper } from './openSearchHelper'
import { DeepPartial, ExcludeId } from './typescriptExtensions'

type Interest = 'Hiking' | 'Poledancing' | 'Yoga'
type Pet = {
  name: string
  species: 'Cat' | 'Dog'
}
type CityEnum = 'London' | 'New York' | 'Amsterdam'

type Data = {
  id: string
  isTrue: boolean
  created: Date
  user: {
    age: number
    city: CityEnum
    interests?: Interest[]
    name: string
    pets?: Pet[]
  }
}

describe('OpenSearchHelper', () => {
  const created = new Date()

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
            created: {
              type: 'date',
            },
            user: {
              age: {
                type: 'integer',
              },
              interests: {
                type: 'keyword',
              },
              pets: {
                type: 'nested',
                properties: {
                  name: {
                    type: 'keyword',
                  },
                  species: {
                    type: 'keyword',
                  },
                },
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
              created: { type: 'date' },
              isTrue: { type: 'boolean' },
              'user.age': { type: 'integer' },
              'user.interests': { type: 'keyword' },
              'user.pets': {
                type: 'nested',
                properties: {
                  name: { type: 'keyword' },
                  species: { type: 'keyword' },
                },
              },
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
        created,
        user: {
          age: 42,
          interests: ['Hiking'],
          name: 'Arthur Dent',
          pets: [
            { name: 'Fido', species: 'Dog' },
            { name: 'Kitty', species: 'Cat' },
          ],
        },
      })
      expect(client.index).toHaveBeenCalledWith({
        index: 'data',
        id: 'foo',
        body: {
          isTrue: true,
          created,
          user: {
            age: 42,
            interests: ['Hiking'],
            name: 'Arthur Dent',
            pets: [
              { name: 'Fido', species: 'Dog' },
              { name: 'Kitty', species: 'Cat' },
            ],
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
            created,
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
            created,
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
          created,
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
    it('handles id', async () => {
      const id = 'foo'
      await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: {
          query: {
            match: {
              id,
            },
          },
        },
      })
      expect(client.search).toHaveBeenCalledWith({
        index: 'data',
        body: {
          query: {
            match: {
              _id: 'foo',
            },
          },
        },
      })
    })
    it('handles match_all', async () => {
      await helper(client as Client).typedSearch<Data>({
        index: 'data',
        body: {
          query: {
            match_all: {},
          },
        },
      })
      expect(client.search).toHaveBeenCalledWith({
        index: 'data',
        body: {
          query: {
            match_all: {},
          },
        },
      })
    })

    describe('handles filters', async () => {
      const europeanCities: CityEnum[] = ['Amsterdam', 'London']

      it('alone', async () => {
        await helper(client as Client).typedSearch<Data>({
          index: 'data',
          body: {
            query: {
              bool: {
                filter: [
                  {
                    term: {
                      'user.city': {
                        value: europeanCities,
                      },
                    },
                  },
                ],
              },
            },
          },
        })
        expect(client.search).toHaveBeenCalledWith({
          index: 'data',
          body: {
            query: {
              bool: {
                filter: [
                  {
                    term: {
                      'user.city': {
                        value: ['Amsterdam', 'London'],
                      },
                    },
                  },
                ],
              },
            },
          },
        })
      })

      it('in conjunction with must+wildcard', async () => {
        await helper(client as Client).typedSearch<Data>({
          index: 'data',
          body: {
            query: {
              bool: {
                must: {
                  wildcard: {
                    'user.name': 'A*',
                  },
                },
                filter: [
                  {
                    term: {
                      'user.city': {
                        value: europeanCities,
                      },
                    },
                  },
                ],
              },
            },
          },
        })
        expect(client.search).toHaveBeenCalledWith({
          index: 'data',
          body: {
            query: {
              bool: {
                must: {
                  wildcard: {
                    'user.name': 'A*',
                  },
                },
                filter: [
                  {
                    term: {
                      'user.city': {
                        value: ['Amsterdam', 'London'],
                      },
                    },
                  },
                ],
              },
            },
          },
        })
      })
    })
  })
})
