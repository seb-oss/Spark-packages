import { expectTypeOf, test } from 'vitest'
import type { IndexDefinition } from './common'
import type { DocumentFor } from './documents'

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

test('a field that is not in the mapping is unknown', () => {
  expectTypeOf<
    DocumentFor<typeof vectorIndex>['label']
  >().toEqualTypeOf<unknown>()
})
