import { describe, expectTypeOf, test } from 'vitest'
import type { OpenSearchClient } from '../client'
import { bulkCreate, bulkIndex, bulkUpdate } from '../helpers'
import type { IndexDefinition } from './common'
import type { DocumentFor, WritableDocument } from './documents'

const vectorIndex = {
  index: 'vectors',
  body: {
    settings: { index: { knn: true } },
    mappings: {
      properties: {
        embedding: { type: 'knn_vector', dimension: 2 },
      },
    },
  },
} as const satisfies IndexDefinition

test('knn_vector field maps to number[]', () => {
  expectTypeOf<DocumentFor<typeof vectorIndex>['embedding']>().toEqualTypeOf<
    number[] | undefined
  >()
})

const properties = {
  id: { type: 'keyword' },
  debug: { type: 'keyword' },
  performance: { type: 'object', properties: { lastNav: { type: 'double' } } },
} as const
const dynamicFalse = {
  index: 'false_v1',
  body: { mappings: { dynamic: 'false', properties } },
} as const satisfies IndexDefinition
const dynamicStrict = {
  index: 'strict_v1',
  body: { mappings: { dynamic: 'strict', properties } },
} as const satisfies IndexDefinition
const dynamicDefault = {
  index: 'default_v1',
  body: { mappings: { properties } },
} as const satisfies IndexDefinition
type FalseIndex = typeof dynamicFalse
type StrictIndex = typeof dynamicStrict
type DefaultIndex = typeof dynamicDefault

describe('DocumentFor', () => {
  test('keyof yields the mapped field names', () => {
    expectTypeOf<keyof DocumentFor<FalseIndex>>().toEqualTypeOf<
      'id' | 'debug' | 'performance'
    >()
  })

  test('Omit keeps the remaining mapped fields with their mapped types', () => {
    type WithoutDebug = Omit<DocumentFor<FalseIndex>, 'debug'>
    expectTypeOf<WithoutDebug['id']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<
      NonNullable<WithoutDebug['performance']>['lastNav']
    >().toEqualTypeOf<number | undefined>()
  })

  test('a mapped field can be overridden with Omit', () => {
    type Overridden = Omit<DocumentFor<FalseIndex>, 'debug'> & {
      debug?: string[]
    }
    expectTypeOf<Overridden['debug']>().toEqualTypeOf<string[] | undefined>()
    expectTypeOf<Overridden['id']>().toEqualTypeOf<string | undefined>()
  })

  test('Pick keeps the picked field type', () => {
    expectTypeOf<Pick<DocumentFor<FalseIndex>, 'id'>>().toEqualTypeOf<{
      id?: string
    }>()
  })
})

describe('writes', () => {
  test('accept unmapped fields when dynamic is false or unset', () => {
    function store(client: OpenSearchClient) {
      client.index<FalseIndex>({
        index: 'false_v1',
        body: { id: 'a', extra: 1 },
      })
      client.index<DefaultIndex>({
        index: 'default_v1',
        body: { id: 'a', extra: 1 },
      })
    }

    void store
  })

  test('reject unmapped fields when dynamic is strict', () => {
    function store(client: OpenSearchClient) {
      client.index<StrictIndex>({
        index: 'strict_v1',
        // @ts-expect-error extra is not in the strict mapping
        body: { id: 'a', extra: 1 },
      })
    }

    void store
  })

  test('mapped fields keep their type', () => {
    function store(client: OpenSearchClient) {
      client.index<FalseIndex>({
        index: 'false_v1',
        // @ts-expect-error id is a keyword
        body: { id: 5 },
      })
    }

    void store
  })

  test('bulk helpers accept unmapped fields when dynamic is not strict', () => {
    bulkIndex<FalseIndex>('false_v1', [{ id: 'a', extra: 1 }])
    bulkCreate<DefaultIndex>('default_v1', [{ id: 'a', extra: 1 }], (doc) =>
      String(doc.id)
    )
    bulkUpdate<FalseIndex>(
      'false_v1',
      [{ doc: { id: 'a', extra: 1 }, upsert: { id: 'a', extra: 1 } }],
      () => 'a'
    )
  })

  test('bulk helpers reject unmapped fields when dynamic is strict', () => {
    // @ts-expect-error extra is not in the strict mapping
    bulkIndex<StrictIndex>('strict_v1', [{ id: 'a', extra: 1 }])
  })

  test('an unmapped field is unknown in a writable document', () => {
    expectTypeOf<
      WritableDocument<FalseIndex>['extra']
    >().toEqualTypeOf<unknown>()
  })
})
