# `@sebspark/opensearch`

A wrapper for OpenSearch Client to assist with typed queries, indices etc

## Add

```zsh
yarn add @sebspark/opensearch
```

## Usage

Everything starts with an index definition. This must be declared as a const which **satisfies** `OpenSearchIndexMapping`. From this you can then derive your documents and search queries.

```typescript
import type {
  IndexDefinition,
  DocumentFor,
  SearchRequest,
} from '@sebspark/opensearch'

export const personIndex = {
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

export type PersonIndex = typeof personIndex
export type PersonDocument = DocumentFor<PersonIndex>
export type PersonSearch = SearchRequest<PersonIndex>
```

`DocumentFor<T>` holds only mapped fields, so the usual type utilities work on it. For example, a mapping cannot say that a `keyword` field holds an array, but `Omit` can:

```typescript
export type TaggedPersonDocument = Omit<PersonDocument, 'name'> & {
  name?: string[]
}
```

Using the index definition and your types, you can now start interacting with OpenSearch with typeahead:

```typescript
import { OpenSearchClient } from '@sebspark/opensearch'
import {
  personIndex,
  type PersonIndex,
  type PersonDocument,
  type PersonSearch,
} from './personIndex'

async function run () {
  const client = new OpenSearchClient()

  // Check if the index exists
  const { body: exists } = await client.indices.exists<PersonIndex>({ index: 'person' })

  // If not: create it
  if (!exists) {
    await client.indices.create(personIndex)
  }

  // Create a document
  const doc: PersonDocument = { // <- This will auto complete on fields and types
    name: 'John Wick',
    age: 52,
  }

  // Store it
  await client.index<PersonIndex>({ // <- This will auto complete on index name
    index: 'person',
    body: doc,
  })

  // Find it
  const searchQuery: PersonSearch = { // <- This will auto complete on fields and types
    index: personIndexName,
    body: {
      query: {
        match: {
          name: 'John Wick'
        }
      }
    }
  }
  const result = await client.search(searchQuery)

  // For an exact match against a single field (no analysis), use `term` instead of `match`.
  // As with `match`, the field name is the key and the value is used directly - no
  // nested `field`/`value` object is needed.
  const exactSearchQuery: PersonSearch = {
    index: personIndexName,
    body: {
      query: {
        term: {
          age: 52
        }
      }
    }
  }
  
  // result.body.hits.hits <- This has type PersonDocument[]
}
```

### Typing never blocks OpenSearch

This package is a helper. Its types suggest fields and values from the mapping, but they accept every request OpenSearch accepts:

- `query`, `sort`, `_source`, `collapse`, `highlight`, aggregation `field`/`filter` and `top_hits` `sort`/`_source` autocomplete fields from the mapping, including top-level multi-field sub-fields such as `title.keyword`, but also accept fields that are not in it, such as fields added by dynamic mapping.
- `DocumentFor<T>` is the document as the mapping describes it: only mapped fields, so `keyof`, `Omit` and `Pick` work on it. Writes (`index`, `bulk`, `bulkIndex`, `bulkCreate`, `bulkUpdate` and `IdFunction`) take `WritableDocument<T>`, which also accepts unmapped fields as `unknown`, unless the mapping sets `dynamic: 'strict'` and OpenSearch would reject them.
- Values are not narrowed beyond what OpenSearch coerces, e.g. `term: { age: '30' }` on an `integer` field compiles. The one exception follows `@opensearch-project/opensearch`: `terms_set.terms` is `string[]`, so pass numbers as strings (`ages.map(String)`).
- A `SearchRequest<T>`, for a concrete index or a generic `T`, can be passed to the `Client` of `@opensearch-project/opensearch`.

```typescript
const articleIndex = {
  index: 'article',
  body: {
    mappings: {
      properties: {
        title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        published: { type: 'date' },
      },
    },
  },
} as const satisfies IndexDefinition

const byExactTitle: SearchRequest<typeof articleIndex> = {
  index: 'article',
  body: {
    query: { term: { 'title.keyword': 'John Wick' } },
    sort: [{ published: { order: 'desc' } }],
  },
}
```

`sort` also takes the direction shorthand, e.g. `sort: [{ published: 'desc' }]`, and `knn_vector` fields are `number[]` in `DocumentFor`.

Only shapes that OpenSearch itself rejects are rejected. If you upgrade from an earlier version:

- `script_score` requires `query`. Add `query: { match_all: {} }` to score every document, as OpenSearch did not accept it without one.
- `knn.filter` is a single query, not an array. Combine several filters in one `bool` query: `filter: { bool: { filter: [a, b] } }`.

### Aggregations

`aggs` (and `aggregations`) are typed against the index as well. `field` on metric aggregations (`max`, `min`, `sum`, `avg`, `value_count`, `cardinality`) and bucket aggregations (`terms`, `date_histogram`, `date_range`, `range`) autocompletes paths from the mapping, including multi-field sub-fields such as `name.keyword`, and accepts any other field name. `filter` takes an index-aware query, and `top_hits` gets index-aware `sort` and `_source`. Sub-aggregations under any bucket aggregation are typed the same way.

```typescript
const stats: PersonSearch = {
  index: 'person',
  body: {
    size: 0,
    aggs: {
      byName: {
        terms: { field: 'name', size: 10 },
        aggs: {
          oldest: { max: { field: 'age' } },
          youngest: { top_hits: { sort: [{ age: { order: 'asc' } }], _source: ['name'], size: 1 } },
        },
      },
    },
  },
}
```

Other aggregations keep the types from `@opensearch-project/opensearch`.

To type a single aggregation outside a request, use `AggregationContainer<T>`:

```typescript
import type { AggregationContainer } from '@sebspark/opensearch'

const oldest: AggregationContainer<PersonIndex> = { max: { field: 'age' } }
```

> `@opensearch-project/opensearch` 3.9.0 dropped `field` and `script` from several aggregation types ([opensearch-js#1154](https://github.com/opensearch-project/opensearch-js/issues/1154)). This package restores them for the aggregations listed above.

## Helpers

### Bulk operations

Since bulk operations are a bit tricky to call, this library offers a few utility functions to simplify:

```typescript
import {
  bulkIndex,
  bulkCreate,
  bulkUpdate,
  bulkDelete,
} from '@sebspark/opensearch'

// create a bunch of documents with automatic id:s
const indexWithAutoId = bulkIndex<PersonIndex>('persons', [
  { name: 'John Wick', age: 52 },
  { name: 'Jason Bourne', age: 50 },
])
await opensearchClient.bulk(indexWithAutoId)

// Name to lower case without spaces
const idGen = (doc: PersonDocument) =>
  doc.name.replace(/\s/g, '').toLowerCase()

// create a bunch of documents with id generator function
const indexWithIdGen = bulkIndex<PersonIndex>('persons', [
  { name: 'John Wick', age: 52 },
  { name: 'Jason Bourne', age: 50 },
], idGen)
await opensearchClient.bulk(indexWithIdGen)

// create a bunch of documents and fail if id exists
const createDocs = bulkCreate<PersonIndex>('persons', [
  { name: 'John Wick', age: 52 },
  { name: 'Jason Bourne', age: 50 },
], idGen)
await opensearchClient.bulk(createDocs)

// update a bunch of documents
const updateDocs = bulkUpdate<PersonIndex>('persons', [
  { doc: { name: 'John Wick', age: 53 } },
  { doc: { name: 'Jason Bourne', age: 51 } },
], idGen)
await opensearchClient.bulk(updateDocs)

// delete a bunch of documents
const deleteDocs = bulkDelete<PersonIndex>('persons', [
  'johnwick',
  'jasonbourne',
])
await opensearchClient.bulk(deleteDocs)
```
