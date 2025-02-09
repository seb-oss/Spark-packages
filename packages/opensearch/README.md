# `@sebspark/opensearch`

A wrapper for OpenSearch Client to assist with typed queries, indices etc

## Add

```zsh
yarn add @sebspark/opensearch @opensearch-project/opensearch
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
  
  // result.body.hits.hits <- This has type PersonDocument[]
}
```

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
