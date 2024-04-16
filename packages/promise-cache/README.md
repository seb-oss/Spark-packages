# `@sebspark/opensearch`

A wrapper for OpenSearch Client to assist with typed queries, indices etc

## Usage

```zsh
yarn add @sebspark/opensearch @opensearch-project/opensearch
```

**Note:** Data types require a property called `id` of type `string`

```typescript
import { Client } from '@opensearch-project/opensearch'
import { helper } from '@sebspark/opensearch'

const client = new Client({})
const typedClient = helper(client)

type Data = {
  id: string
  user: {
    name: string
    age: number
  }
  blog: {
    posts: Array<{
      title: string
      text: string
    }>
  }
}

type UserOnly = Pick<Data, 'id' | 'user'>

// Typed index creation
async function createIndex() {
  await helper(client as Client).typedIndexCreate<Data>('data', {
    mappings: {
      properties: {
        user: {
          age: {
            type: 'integer'
          },
        },
        isTrue: {
          type: 'boolean'
        }
      }
    }
  })
}

// Typed insert
async function indexDocument() {
  await helper(client as Client).typedIndex<Data>('data', {
    id: 'foo',
    isTrue: true,
    user: {
      age: 42,
      name: 'Arthur Dent',
    }
  })
}

// Typed search
async function loadData() {
  // result: Data[]
  const { result } = await typedClient.typedSearch<Data>({
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
  return result
}
async function loadPartialData() {
  // result: UserOnly[]
  const { result } = await typedClient.typedSearch<Data, UserOnly>({
    index: 'data',
    body: {
      query: {
        fields: ['user.age', 'user.name'],
      },
    },
  })
  return result
}
```
