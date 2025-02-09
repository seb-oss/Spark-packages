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
  OpenSearchIndexMapping,
  DocumentFor,
  SearchRequest,
} from '@sebspark/opensearch'

export const personIndex = {
  index: 'persons',
  mappings: {
    properties: {
      name: { type: 'keyword', required: true },
      age: { type: 'integer', required: true },
    }
  }
} as const satisfies OpenSearchIndexMapping // Must be declared as const

export type PersonIndex = typeof personIndex
export type PersonDocument = DocumentFor<PersonIndex>
export type PersonSearch = SearchRequest<PersonIndex>
```

Using the index definition and your types, you can now start interacting with OpenSearch with typeahead:

```typescript
import { OpenSearchClient } from '@sebspark/opensearch'
import {
  personIndex,
  personIndexName,
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
  await client.index<PersonIndex>({
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
