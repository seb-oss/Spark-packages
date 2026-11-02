import type { Client } from '@opensearch-project/opensearch'
import { test } from 'vitest'
import type { OpenSearchClient } from '../client'
import type { IndexDefinition } from './common'
import type { SearchRequest } from './search'

// Every request in this file is accepted by OpenSearch (see test.e2e.ts), so
// the typing must accept it too.

const personIndex = {
  index: 'person',
  body: {
    mappings: {
      properties: {
        name: { type: 'keyword' },
        age: { type: 'integer' },
      },
    },
  },
} as const satisfies IndexDefinition

type PersonIndex = typeof personIndex

test('a generic SearchRequest<T> can be passed to the upstream Client', () => {
  function search<T extends IndexDefinition>(
    client: Client,
    request: SearchRequest<T>
  ) {
    return client.search(request)
  }

  void search
})

test('index accepts a document with a field that is not in the mapping', () => {
  function store(client: OpenSearchClient) {
    return client.index<PersonIndex>({
      index: 'person',
      body: { name: 'John Wick', age: 52, nickname: 'Johnny' },
    })
  }

  void store
})

test('query accepts a field that is not in the mapping', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { query: { term: { nickname: 'Johnny' } } },
  }

  void search
})

test('query accepts a string for a numeric field', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { query: { term: { age: '52' } } },
  }

  void search
})

test('sort accepts a field that is not in the mapping', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { sort: [{ nickname: { order: 'asc', unmapped_type: 'keyword' } }] },
  }

  void search
})

test('aggregation field accepts a field that is not in the mapping', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { aggs: { top: { max: { field: 'score' } } } },
  }

  void search
})

test('aggregation filter accepts a field that is not in the mapping', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { aggs: { johnnies: { filter: { term: { nickname: 'Johnny' } } } } },
  }

  void search
})

test('top_hits sort accepts a field that is not in the mapping', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      aggs: {
        newest: {
          top_hits: {
            sort: [{ nickname: { order: 'asc', unmapped_type: 'keyword' } }],
            size: 1,
          },
        },
      },
    },
  }

  void search
})

test('top_hits _source accepts a field that is not in the mapping', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      aggs: { newest: { top_hits: { _source: ['nickname'], size: 1 } } },
    },
  }

  void search
})

test('_source accepts fields that are not in the mapping and wildcards', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { _source: { includes: ['name', 'nickname', 'meta.*'] } },
  }

  void search
})

test('collapse accepts a field that is not in the mapping', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { collapse: { field: 'nickname.keyword' } },
  }

  void search
})

test('highlight accepts a field that is not in the mapping', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { highlight: { fields: { nickname: {} } } },
  }

  void search
})
