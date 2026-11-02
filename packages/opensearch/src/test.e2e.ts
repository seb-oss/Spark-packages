import {
  OpenSearchContainer,
  type StartedOpenSearchContainer,
} from '@testcontainers/opensearch'
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

let container: StartedOpenSearchContainer
let opensearchClient: OpenSearchClient

beforeAll(async () => {
  container = await new OpenSearchContainer(
    'opensearchproject/opensearch:2.19.6'
  )
    .withSecurityEnabled(false)
    .withLabels({ package: '@sebspark/opensearch' })
    .start()

  opensearchClient = new OpenSearchClient({ node: container.getHttpUrl() })
}, 120_000)

it('can connect to OpenSearch', async () => {
  const info = await opensearchClient.info()

  expect(info.body).toHaveProperty('version')
})

describe('OpenSearchClient', () => {
  describe('personIndex', () => {
    const personIndex = {
      index: 'person',
      body: {
        mappings: {
          properties: {
            name: { type: 'keyword' },
            text: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword',
                },
              },
            },
            assets: {
              type: 'nested',
              properties: {
                id: { type: 'keyword' },
                name: { type: 'keyword' },
              },
            },
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
      text: 'Sortable',
      assets: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
    }

    it('creates an index from an index definition', async () => {
      const exists = await opensearchClient.indices.exists<PersonIndex>({
        index: personIndex.index,
      })
      if (exists.body) {
        await opensearchClient.indices.delete({ index: personIndex.index })
      }
      const response = await opensearchClient.indices.create(personIndex)

      expect(response.body.acknowledged).toBe(true)
    })
    it('stores a typed document', async () => {
      // Store
      const response = await opensearchClient.index<PersonIndex>({
        index: 'person',
        body: doc,
        refresh: true, // ✅ Ensures the document is searchable immediately
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
    it('sorts by text with keyword field', async () => {
      // Find
      const search: PersonSearch = {
        index: 'person',
        body: {
          query: {
            match_all: {},
          },
          sort: { 'text.keyword': { order: 'asc' } },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.hits.hits).toHaveLength(1)
      expect(result.body.hits.hits[0]._source).toEqual(doc)
    })
    it('finds a document by nested property', async () => {
      // Find
      const search: PersonSearch = {
        index: 'person',
        body: {
          query: {
            nested: {
              path: 'assets',
              query: {
                bool: {
                  should: [{ match: { 'assets.id': 'a' } }],
                },
              },
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
        refresh: 'wait_for',
        body: [
          // Index operation: auto-generated _id for "Winston Scott"
          { index: {} },
          { name: 'Winston Scott', age: 70 },

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

      // Verify that the "Winston Scott" document (from the index operation) still exists.
      const winstonScottSearch: PersonSearch = {
        index: 'person',
        body: {
          query: {
            match: { name: 'Winston Scott' },
          },
        },
      }
      const winstonScottResult =
        await opensearchClient.search(winstonScottSearch)
      expect(winstonScottResult.body.hits.hits).toHaveLength(1)
      expect(winstonScottResult.body.hits.hits[0]._source.age).toBe(70)

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
        expect(indexResponse.body.items).toHaveLength(2)
        expect(indexResponse.body.items[0].index.status).toBe(201)
        expect(indexResponse.body.items[1].index.status).toBe(201)

        // Verify that the documents are indexed.
        const searchResponse = await opensearchClient.search<PersonIndex>({
          index: 'person',
          body: { query: { match_all: {} } },
        })
        const names = searchResponse.body.hits.hits.map(
          (hit) => hit._source.name
        )
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
          doc.name!.replace(/\s/g, '').toLowerCase()
        const bulkCreatePayload = bulkCreate(
          personIndex.index,
          createDocs,
          createIdFn
        )
        bulkCreatePayload.refresh = 'wait_for'
        const createResponse = await opensearchClient.bulk(bulkCreatePayload)

        // Expect one response per document.
        expect(createResponse.body.items).toHaveLength(2)
        expect(createResponse.body.items[0].create.status).toBe(201)
        expect(createResponse.body.items[1].create.status).toBe(201)

        // Verify that the created documents exist.
        const searchResponse = await opensearchClient.search<PersonIndex>({
          index: 'person',
          body: { query: { match_all: {} } },
        })
        const names = searchResponse.body.hits.hits.map(
          (hit) => hit._source.name
        )
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
          doc.name!.replace(/\s/g, '').toLowerCase()
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
  describe('reportIndex', () => {
    const reportIndex = {
      index: `report_v0.1.0`,
      body: {
        mappings: {
          dynamic: 'false',
          properties: {
            reportId: { type: 'integer' },
            changedDate: { type: 'date' },
            publishedDate: { type: 'date' },
            isin: { type: 'keyword' },
            hasRecommendationChange: { type: 'boolean' },
            hasTargetPriceChange: { type: 'boolean' },
            sectors: {
              type: 'nested',
              properties: {
                gics: { type: 'keyword' },
                name: { type: 'keyword' },
              },
            },
            content: {
              type: 'object',
              properties: {
                en: {
                  type: 'object',
                  properties: {
                    title: { type: 'text' },
                    reportType: { type: 'keyword' },
                  },
                },
                sv: {
                  type: 'object',
                  properties: {
                    title: { type: 'text' },
                    reportType: { type: 'keyword' },
                  },
                },
              },
            },
          },
        },
      },
    } as const satisfies IndexDefinition

    type ReportIndex = typeof reportIndex
    type ReportDocument = DocumentFor<ReportIndex>
    type ReportSearch = SearchRequest<ReportIndex>

    const doc: ReportDocument = {
      isin: 'SE0000108656',
      publishedDate: '2024-03-20',
    }

    it('creates an index from an index definition', async () => {
      const exists = await opensearchClient.indices.exists<ReportIndex>({
        index: reportIndex.index,
      })
      if (exists.body) {
        await opensearchClient.indices.delete({ index: reportIndex.index })
      }
      const response = await opensearchClient.indices.create(reportIndex)

      expect(response.body.acknowledged).toBe(true)
    })
    it('stores a typed document', async () => {
      // Store
      const response = await opensearchClient.index<ReportIndex>({
        index: reportIndex.index,
        body: doc,
        refresh: true, // ✅ Ensures the document is searchable immediately
      })

      expect(response.statusCode).toEqual(201)
    })
    it('finds a typed document', async () => {
      // Find
      const search: ReportSearch = {
        index: reportIndex.index,
        body: {
          query: {
            match: {
              isin: doc.isin,
            },
          },
          sort: {
            publishedDate: 'desc',
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.hits.hits).toHaveLength(1)
      expect(result.body.hits.hits[0]._source).toEqual(doc)
    })
  })

  describe('tradesIndex aggregations', () => {
    const tradesIndex = {
      index: 'trades',
      body: {
        mappings: {
          properties: {
            assetId: { type: 'keyword' },
            assetName: {
              type: 'text',
              fields: { keyword: { type: 'keyword' } },
            },
            date: { type: 'date' },
            last: { type: 'double' },
            bid: { type: 'double' },
            ask: { type: 'double' },
            nav: { type: 'double' },
            high: { type: 'double' },
            low: { type: 'double' },
            volume: { type: 'long' },
          },
        },
      },
    } as const satisfies IndexDefinition

    type TradesIndex = typeof tradesIndex
    type TradeDocument = DocumentFor<TradesIndex>
    type TradesSearch = SearchRequest<TradesIndex>

    const trades: TradeDocument[] = [
      {
        assetId: 'A',
        assetName: 'Alpha Fund',
        date: '2025-01-10',
        last: 10.5,
        bid: 10.4,
        ask: 10.6,
        nav: 10,
        high: 11,
        low: 9,
        volume: 100,
      },
      {
        assetId: 'A',
        assetName: 'Alpha Fund',
        date: '2025-01-20',
        last: 12.5,
        bid: 12.4,
        ask: 12.6,
        nav: 12,
        high: 13,
        low: 11,
        volume: 200,
      },
      {
        assetId: 'A',
        assetName: 'Alpha Fund',
        date: '2025-02-15',
        last: 8.5,
        bid: 8.4,
        ask: 8.6,
        nav: 8,
        high: 9,
        low: 7,
        volume: 50,
      },
      {
        assetId: 'B',
        assetName: 'Beta Fund',
        date: '2025-01-05',
        last: 100.5,
        bid: 100,
        ask: 101,
        nav: 100,
        high: 101,
        low: 99,
        volume: 10,
      },
      {
        assetId: 'B',
        assetName: 'Beta Fund',
        date: '2025-12-01',
        last: 120.5,
        bid: 120,
        ask: 122,
        nav: 120,
        high: 121,
        low: 119,
        volume: 20,
      },
    ]

    beforeAll(async () => {
      const exists = await opensearchClient.indices.exists<TradesIndex>({
        index: tradesIndex.index,
      })
      if (exists.body) {
        await opensearchClient.indices.delete({ index: tradesIndex.index })
      }
      await opensearchClient.indices.create(tradesIndex)

      const payload = bulkIndex(tradesIndex.index, trades)
      payload.refresh = 'wait_for'
      await opensearchClient.bulk(payload)
    })

    it('max and min on a date field return the latest and earliest date', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: {
            latest: { max: { field: 'date' } },
            earliest: { min: { field: 'date' } },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        latest: { value_as_string: '2025-12-01T00:00:00.000Z' },
        earliest: { value_as_string: '2025-01-05T00:00:00.000Z' },
      })
    })

    it('sum, avg, value_count and cardinality compute over mapped fields', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: {
            volume: { sum: { field: 'volume' } },
            averageNav: { avg: { field: 'nav' } },
            count: { value_count: { field: 'assetId' } },
            assets: { cardinality: { field: 'assetId' } },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        volume: { value: 380 },
        averageNav: { value: 50 },
        count: { value: 5 },
        assets: { value: 2 },
      })
    })

    it('max accepts a script instead of a field', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: {
            spread: {
              max: {
                script: { source: "doc['ask'].value - doc['bid'].value" },
              },
            },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({ spread: { value: 2 } })
    })

    it('the aggregations key is accepted like aggs', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggregations: { latest: { max: { field: 'date' } } },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        latest: { value_as_string: '2025-12-01T00:00:00.000Z' },
      })
    })

    it('terms on a multi-field sub-field buckets by keyword', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: { names: { terms: { field: 'assetName.keyword', size: 10 } } },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        names: {
          buckets: [
            { key: 'Alpha Fund', doc_count: 3 },
            { key: 'Beta Fund', doc_count: 2 },
          ],
        },
      })
    })

    it('date_histogram with top_hits and metric sub-aggregations', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          query: { term: { assetId: 'A' } },
          aggs: {
            buckets: {
              date_histogram: {
                field: 'date',
                calendar_interval: 'month',
                order: { _key: 'asc' },
              },
              aggs: {
                newest: {
                  top_hits: {
                    sort: [{ date: { order: 'desc' } }],
                    _source: ['last', 'bid', 'ask', 'date', 'nav'],
                    size: 1,
                  },
                },
                high: { max: { field: 'high' } },
                low: { min: { field: 'low' } },
                volume: { sum: { field: 'volume' } },
              },
            },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        buckets: {
          buckets: [
            {
              key_as_string: '2025-01-01T00:00:00.000Z',
              doc_count: 2,
              high: { value: 13 },
              low: { value: 9 },
              volume: { value: 300 },
              newest: {
                hits: {
                  hits: [
                    {
                      _source: {
                        last: 12.5,
                        bid: 12.4,
                        ask: 12.6,
                        date: '2025-01-20',
                        nav: 12,
                      },
                    },
                  ],
                },
              },
            },
            {
              key_as_string: '2025-02-01T00:00:00.000Z',
              doc_count: 1,
              high: { value: 9 },
              low: { value: 7 },
              volume: { value: 50 },
            },
          ],
        },
      })
    })

    it('top_hits only returns the requested _source fields', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: {
            newest: {
              top_hits: {
                sort: [{ date: { order: 'desc' } }],
                _source: ['date', 'nav'],
                size: 1,
              },
            },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toEqual({
        newest: {
          hits: expect.objectContaining({
            hits: [
              expect.objectContaining({
                _source: { date: '2025-12-01', nav: 120 },
              }),
            ],
          }),
        },
      })
    })

    it('terms with nested date_range, max and top_hits sub-aggregations', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: {
            perAsset: {
              terms: { field: 'assetId', size: 100 },
              aggs: {
                periods: {
                  date_range: {
                    field: 'date',
                    ranges: [{ key: '1y', from: '2025-06-01' }, { key: 'max' }],
                  },
                  aggs: {
                    high: { max: { field: 'nav' } },
                    open: {
                      top_hits: {
                        sort: [{ date: { order: 'asc' } }],
                        _source: ['date', 'nav'],
                        size: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        perAsset: {
          buckets: [
            {
              key: 'A',
              periods: {
                buckets: expect.arrayContaining([
                  expect.objectContaining({
                    key: '1y',
                    doc_count: 0,
                    high: { value: null },
                  }),
                  expect.objectContaining({
                    key: 'max',
                    doc_count: 3,
                    high: { value: 12 },
                    open: expect.objectContaining({
                      hits: expect.objectContaining({
                        hits: [
                          expect.objectContaining({
                            _source: { date: '2025-01-10', nav: 10 },
                          }),
                        ],
                      }),
                    }),
                  }),
                ]),
              },
            },
            {
              key: 'B',
              periods: {
                buckets: expect.arrayContaining([
                  expect.objectContaining({
                    key: '1y',
                    doc_count: 1,
                    high: { value: 120 },
                  }),
                  expect.objectContaining({
                    key: 'max',
                    doc_count: 2,
                    high: { value: 120 },
                    open: expect.objectContaining({
                      hits: expect.objectContaining({
                        hits: [
                          expect.objectContaining({
                            _source: { date: '2025-01-05', nav: 100 },
                          }),
                        ],
                      }),
                    }),
                  }),
                ]),
              },
            },
          ],
        },
      })
    })

    it('range buckets by a mapped field with sub-aggregations', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: {
            navBands: {
              range: { field: 'nav', ranges: [{ to: 100 }, { from: 100 }] },
              aggs: { volume: { sum: { field: 'volume' } } },
            },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        navBands: {
          buckets: [
            { doc_count: 3, volume: { value: 350 } },
            { doc_count: 2, volume: { value: 30 } },
          ],
        },
      })
    })

    it('filter narrows sub-aggregations with an index-aware query', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: {
            recent: {
              filter: { range: { date: { gte: '2025-06-01' } } },
              aggs: { high: { max: { field: 'high' } } },
            },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        recent: { doc_count: 1, high: { value: 121 } },
      })
    })

    it('a bucket aggregation that is not overridden accepts index-aware sub-aggregations', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          aggs: {
            byNav: {
              histogram: { field: 'nav', interval: 100 },
              aggs: { high: { max: { field: 'high' } } },
            },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        byNav: {
          buckets: [
            { key: 0, doc_count: 3, high: { value: 13 } },
            { key: 100, doc_count: 2, high: { value: 121 } },
          ],
        },
      })
    })

    it('a pipeline aggregation keeps its upstream type', async () => {
      const search: TradesSearch = {
        index: 'trades',
        body: {
          size: 0,
          query: { term: { assetId: 'A' } },
          aggs: {
            monthly: {
              date_histogram: { field: 'date', calendar_interval: 'month' },
              aggs: {
                high: { max: { field: 'high' } },
                change: { derivative: { buckets_path: 'high' } },
              },
            },
          },
        },
      }

      const result = await opensearchClient.search(search)

      expect(result.body.aggregations).toMatchObject({
        monthly: {
          buckets: [
            { high: { value: 13 } },
            { high: { value: 9 }, change: { value: -4 } },
          ],
        },
      })
    })
  })
})
