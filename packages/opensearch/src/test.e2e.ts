import { GenericContainer, type StartedTestContainer } from 'testcontainers'
import { beforeAll, describe, expect, it } from 'vitest'
import { OpenSearchClient } from './client'
import { bulkCreate, bulkDelete, bulkIndex, bulkUpdate } from './helpers'
import type {
  BulkRequest,
  DocumentFor,
  IndexDefinition,
  SearchRequest,
  UpdateAction,
} from './types'

let container: StartedTestContainer
let opensearchClient: OpenSearchClient

beforeAll(async () => {
  const image = 'opensearchproject/opensearch:2.18.0'

  console.log(`Pulling image ${image}`)
  container = await new GenericContainer(image)
    .withExposedPorts(9200, 9600) // OpenSearch runs on 9200 (API) and 9600 (monitoring)
    .withEnvironment({
      'discovery.type': 'single-node',
      OPENSEARCH_JAVA_OPTS: '-Xms512m -Xmx512m',
      OPENSEARCH_INITIAL_ADMIN_PASSWORD: 'admin-password', // ✅ Fix: Set initial password
      DISABLE_INSTALL_DEMO_CONFIG: 'true', // ✅ Optional: Prevent demo config installation
      DISABLE_SECURITY_PLUGIN: 'true', // ✅ Optional: Disable security plugin if not needed
    })
    .withStartupTimeout(120_000) // ✅ Increase startup timeout
    .withLogConsumer((stream) => {
      // stream.on('data', line => process.stdout.write(`[OpenSearch] ${line.toString()}`))
      stream.on('err', (line) =>
        process.stderr.write(`[OpenSearch] [ERROR] ${line.toString()}`)
      )
    })
    .start()

  const port = container.getMappedPort(9200)
  const host = container.getHost()

  // Create OpenSearch client
  opensearchClient = new OpenSearchClient({ node: `http://${host}:${port}` })

  // Wait for OpenSearch to be ready
  let isReady = false
  for (let i = 0; i < 10; i++) {
    try {
      const response = await opensearchClient.ping()
      if (response) {
        isReady = true
        break
      }
    } catch (err) {
      console.log('Waiting for OpenSearch to be ready...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  if (!isReady) {
    console.log(await container.logs())

    throw new Error('OpenSearch did not start in time')
  }

  console.log('OpenSearch container ready')
}, 120000)

it('can connect to OpenSearch', async () => {
  const info = await opensearchClient.info()

  expect(info.body).toHaveProperty('version')
})

describe('OpenSearchClient', () => {
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
  type PersonDocument = DocumentFor<PersonIndex>
  type PersonSearch = SearchRequest<PersonIndex>

  const doc: PersonDocument = {
    age: 52,
    name: 'John Wick',
  }

  it('creates an index from an index definition', async () => {
    opensearchClient.indices.exists<PersonIndex>({ index: 'person' })
    const response = await opensearchClient.indices.create(personIndex)

    expect(response.body.acknowledged).toBe(true)
  })

  it('stores a typed document', async () => {
    // Store
    const response = await opensearchClient.index<PersonIndex>({
      index: 'person',
      body: doc,
      refresh: 'wait_for', // ✅ Ensures the document is searchable immediately
    })

    expect(response.statusCode).toEqual(201)
  })

  it('finds a typed document', async () => {
    // Find
    const search: PersonSearch = {
      index: 'person',
      body: {
        query: {
          match: {
            name: doc.name,
          },
        },
      },
    }

    const result = await opensearchClient.search(search)

    expect(result.body.hits.hits).toHaveLength(1)
    expect(result.body.hits.hits[0]._source).toEqual(doc)
  })

  it('manages bulk operations', async () => {
    // Prepare bulk operations
    const bulkRequest: BulkRequest<PersonIndex> = {
      index: 'person',
      body: [
        // Index operation: auto-generated _id for "John Wick"
        { index: {} },
        { name: 'John Wick', age: 52 },

        // Create operation: explicitly creates "Jason Bourne" with id "foo"
        { create: { _id: 'foo' } },
        { name: 'Jason Bourne', age: 48 },

        // Update operation: update document with id "foo" to change its age from 48 to 49
        { update: { _id: 'foo' } },
        { doc: { age: 49 } },

        // Delete operation: delete document with id "foo"
        { delete: { _id: 'foo' } },
      ],
    }

    // Send bulk request
    const bulkResponse = await opensearchClient.bulk(bulkRequest)

    // Assert that there are exactly 4 responses (one for each action line)
    expect(bulkResponse.body.items).toHaveLength(4)

    // Verify the index operation response (first item)
    expect(bulkResponse.body.items[0].index.status).toBe(201) // 201 Created

    // Verify the create operation response (second item)
    expect(bulkResponse.body.items[1].create.status).toBe(201) // 201 Created

    // Verify the update operation response (third item)
    expect(bulkResponse.body.items[2].update.status).toBe(200) // 200 OK

    // Verify the delete operation response (fourth item)
    expect(bulkResponse.body.items[3].delete.status).toBe(200) // 200 OK

    // Verify that the "John Wick" document (from the index operation) still exists.
    const johnWickSearch: PersonSearch = {
      index: 'person',
      body: {
        query: {
          match: { name: 'John Wick' },
        },
      },
    }
    const johnWickResult = await opensearchClient.search(johnWickSearch)
    expect(johnWickResult.body.hits.hits).toHaveLength(1)
    expect(johnWickResult.body.hits.hits[0]._source.age).toBe(52)

    // Verify that the document with id "foo" (created, updated, then deleted) no longer exists.
    const fooSearch: PersonSearch = {
      index: 'person',
      body: {
        query: {
          match: { _id: 'foo' },
        },
      },
    }
    const fooResult = await opensearchClient.search(fooSearch)
    expect(fooResult.body.hits.hits).toHaveLength(0)
  })

  describe('e2e: Bulk operations helpers', () => {
    it('bulkIndex: should index documents', async () => {
      // Insert documents using bulkIndex (auto-generated IDs).
      const indexDocs: PersonDocument[] = [
        { name: 'John Wick', age: 52 },
        { name: 'Alice', age: 30 },
      ]
      const bulkIndexPayload = bulkIndex(personIndex.index, indexDocs)
      bulkIndexPayload.refresh = 'wait_for'
      const indexResponse = await opensearchClient.bulk(bulkIndexPayload)

      // Expect one response per document.
      expect(indexResponse.body.items).toHaveLength(indexDocs.length)
      indexResponse.body.items.forEach((item) => {
        expect(item.index.status).toBe(201)
      })

      // Verify that the documents are indexed.
      const searchResponse = await opensearchClient.search({
        index: 'person',
        body: { query: { match_all: {} } },
      })
      const names = searchResponse.body.hits.hits.map((hit) => hit._source.name)
      expect(names).toContain('John Wick')
      expect(names).toContain('Alice')
    })

    it('bulkCreate: should create documents with explicit IDs', async () => {
      // Create documents using bulkCreate (explicit IDs).
      const createDocs: PersonDocument[] = [
        { name: 'Jason Bourne', age: 48 },
        { name: 'Evelyn Salt', age: 35 },
      ]
      const createIdFn = (doc: PersonDocument) =>
        doc.name.replace(/\s/g, '').toLowerCase()
      const bulkCreatePayload = bulkCreate(
        personIndex.index,
        createDocs,
        createIdFn
      )
      bulkCreatePayload.refresh = 'wait_for'
      const createResponse = await opensearchClient.bulk(bulkCreatePayload)

      // Expect one response per document.
      expect(createResponse.body.items).toHaveLength(createDocs.length)
      createResponse.body.items.forEach((item) => {
        expect(item.create.status).toBe(201)
      })

      // Verify that the created documents exist.
      const searchResponse = await opensearchClient.search({
        index: 'person',
        body: { query: { match_all: {} } },
      })
      const names = searchResponse.body.hits.hits.map((hit) => hit._source.name)
      expect(names).toContain('Jason Bourne')
      expect(names).toContain('Evelyn Salt')
    })

    it('bulkUpdate: should update an existing document and upsert a new one', async () => {
      // Prepare update actions:
      // a) Update "Jason Bourne" to change age from 48 to 50.
      // b) Upsert a document "Non Existent" with age 60.
      const updateActions: UpdateAction<PersonIndex>[] = [
        { doc: { name: 'Jason Bourne', age: 50 } },
        {
          doc: { name: 'Non Existent', age: 60 },
          upsert: { name: 'Non Existent', age: 60 },
        },
      ]
      // Use the same ID generator as in bulkCreate.
      const updateIdFn = (doc: PersonDocument) =>
        doc.name.replace(/\s/g, '').toLowerCase()
      const bulkUpdatePayload = bulkUpdate(
        personIndex.index,
        updateActions,
        updateIdFn
      )
      bulkUpdatePayload.refresh = 'wait_for'
      const updateResponse = await opensearchClient.bulk(bulkUpdatePayload)

      expect(updateResponse.body.items).toHaveLength(2)
      expect(updateResponse.body.items[0].update.status).toBe(200)
      expect(updateResponse.body.items[1].update.status).toBe(201)

      // Verify that "Jason Bourne" now has age 50.
      const searchJason = await opensearchClient.search<PersonIndex>({
        index: 'person',
        body: { query: { match: { name: 'Jason Bourne' } } },
      })
      const jason = searchJason.body.hits.hits.find(
        (hit) => hit._source.name === 'Jason Bourne'
      )
      expect(jason?._source.age).toBe(50)

      // Verify that the "Non Existent" document was upserted with age 60.
      const searchNonExistent = await opensearchClient.search<PersonIndex>({
        index: 'person',
        body: { query: { match: { name: 'Non Existent' } } },
      })
      const nonExistent = searchNonExistent.body.hits.hits.find(
        (hit) => hit._source.name === 'Non Existent'
      )
      expect(nonExistent?._source.age).toBe(60)
    })

    it('bulkDelete: should delete a document', async () => {
      // Delete the "Non Existent" document.
      // Compute its ID using the same generator used in updates/creates.
      const deleteId = 'nonexistent'
      const bulkDeletePayload = bulkDelete(personIndex.index, [deleteId])
      bulkDeletePayload.refresh = 'wait_for'
      const deleteResponse = await opensearchClient.bulk(bulkDeletePayload)

      expect(deleteResponse.body.items).toHaveLength(1)
      expect(deleteResponse.body.items[0].delete.status).toBe(200)

      // Verify that "Non Existent" is no longer found.
      const searchAfterDelete = await opensearchClient.search<PersonIndex>({
        index: 'person',
        body: { query: { match: { name: 'Non Existent' } } },
      })
      expect(searchAfterDelete.body.hits.hits).toHaveLength(0)
    })
  })
})
