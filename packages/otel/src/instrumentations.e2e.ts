import type { Server } from 'node:http'
import { Client as OpensearchClient } from '@opensearch-project/opensearch'
import type { ReadableSpan } from '@opentelemetry/sdk-trace-node'
import {
  ATTR_DB_COLLECTION_NAME,
  ATTR_DB_OPERATION_NAME,
  ATTR_DB_QUERY_TEXT,
  ATTR_DB_SYSTEM_NAME,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
} from '@opentelemetry/semantic-conventions'
import {
  OpenSearchContainer,
  StartedOpenSearchContainer,
} from '@testcontainers/opensearch'
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis'
import axios, { type Axios } from 'axios'
import express, { type Express, type Request, type Response } from 'express'
import { findFreePorts } from 'find-free-ports'
import { createClient as createRedisClient } from 'redis'
import { fetch } from 'undici'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from 'vitest'

const { spanExporter, logExporter, dispose } = await vi.hoisted(async () => {
  const { instrumentations } = await import('./index')
  const { InMemorySpanExporter, SimpleSpanProcessor } = await import(
    '@opentelemetry/sdk-trace-node'
  )
  const {
    InMemoryLogRecordExporter,
    SimpleLogRecordProcessor,
    LoggerProvider,
  } = await import('@opentelemetry/sdk-logs')
  const { NodeSDK } = await import('@opentelemetry/sdk-node')
  const { InMemoryMetricExporter, PeriodicExportingMetricReader } =
    await import('@opentelemetry/sdk-metrics')
  const { logs } = await import('@opentelemetry/api-logs')

  const spanExporter = new InMemorySpanExporter()
  const logExporter = new InMemoryLogRecordExporter()

  const logProvider = new LoggerProvider({
    processors: [new SimpleLogRecordProcessor(logExporter)],
  })
  logs.setGlobalLoggerProvider(logProvider)

  const sdk = new NodeSDK({
    spanProcessor: new SimpleSpanProcessor(spanExporter),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new InMemoryMetricExporter(0),
    }),
    instrumentations: await Promise.all([
      instrumentations.express(),
      instrumentations.http(),
      instrumentations.opensearch(),
      instrumentations.redis(),
      instrumentations.undici(),
    ]),
  })
  sdk.start()

  return {
    spanExporter,
    logExporter,
    dispose: async () => {
      await sdk.shutdown()
      await logProvider.shutdown()
    },
  }
})

type RequestHandler = Mock<(req: Request, res: Response) => unknown>

describe('instrumentations', () => {
  let opensearchContainer: StartedOpenSearchContainer
  let redisContainer: StartedRedisContainer

  let expressServer: Express
  let httpServer: Server
  let expressHost: string
  let getHandler: RequestHandler
  let postHandler: RequestHandler

  let opensearchClient: OpensearchClient
  let redisClient: ReturnType<typeof createRedisClient>
  let axiosClient: Axios

  beforeAll(async () => {
    spanExporter.reset()
    logExporter.reset()

    opensearchContainer = await new OpenSearchContainer(
      'opensearchproject/opensearch:3'
    )
      .withReuse()
      .start()
    redisContainer = await new RedisContainer('redis:8-alpine')
      .withReuse()
      .start()

    expressServer = express()
    getHandler = vi.fn((req, res) => {
      res.status(200).json({ method: req.method })
    })
    expressServer.get('/', getHandler)
    postHandler = vi.fn((req, res) => {
      res.status(200).json({ method: req.method })
    })
    expressServer.post('/', postHandler)
    const [port] = await findFreePorts(1)
    httpServer = await new Promise<Server>((res, rej) => {
      const server = expressServer.listen(port, (err) => {
        if (err) rej(err)
        else res(server)
      })
    })

    opensearchClient = new OpensearchClient({
      node: opensearchContainer.getHttpUrl(),
      auth: {
        username: opensearchContainer.getUsername(),
        password: opensearchContainer.getPassword(),
      },
      ssl: { rejectUnauthorized: false },
    })
    redisClient = createRedisClient({ url: redisContainer.getConnectionUrl() })
    await redisClient.connect()

    expressHost = `http://localhost:${port}`
    axiosClient = axios.create({ baseURL: expressHost })
  }, 120_000)
  beforeEach(async () => {
    spanExporter.reset()
    logExporter.reset()

    await opensearchClient.indices.delete({
      index: '*,-.*',
      ignore_unavailable: true,
      allow_no_indices: true,
    })
    await redisClient.flushAll()
  })
  afterAll(async () => {
    await opensearchClient.indices.delete({
      index: '*,-.*',
      ignore_unavailable: true,
      allow_no_indices: true,
    })
    await redisClient.flushAll()

    await redisClient.quit()
    await opensearchContainer.stop()
    await redisContainer.stop()
    await new Promise<void>((res, rej) => {
      httpServer.close((err) => {
        if (err) rej(err)
        else res()
      })
    })
    await dispose()
  })

  describe('http/express', () => {
    it('lets requests through', async () => {
      const [get, post] = await Promise.all([
        axiosClient.get('/'),
        axiosClient.post('/'),
      ])

      expect(get.status).toEqual(200)
      expect(get.data).toEqual({ method: 'GET' })
      expect(post.status).toEqual(200)
      expect(post.data).toEqual({ method: 'POST' })
    })
    it('traces http calls', async () => {
      const [get, post] = await Promise.all([
        axiosClient.get('/'),
        axiosClient.post('/'),
      ])
      await spanExporter.forceFlush()

      const spans = spanExporter.getFinishedSpans()
      // filter on correct scope and only outgoing
      const httpSpans = spans.filter((span) => {
        return (
          span.instrumentationScope.name ===
            '@opentelemetry/instrumentation-http' &&
          span.attributes['http.user_agent'] === undefined
        )
      })

      expect(httpSpans).toHaveLength(2)
      expect(httpSpans[0]).toEqual(
        expect.objectContaining<Partial<ReadableSpan>>({
          name: 'GET localhost/',
        })
      )
      expect(httpSpans[1]).toEqual(
        expect.objectContaining<Partial<ReadableSpan>>({
          name: 'POST localhost/',
        })
      )
    })
  })
  describe('undici/express', () => {
    it('lets requests through', async () => {
      const [get, post] = await Promise.all([
        fetch(expressHost),
        fetch(expressHost, { method: 'POST' }),
      ])

      expect(get.status).toEqual(200)
      await expect(await get.json()).toEqual({ method: 'GET' })

      expect(post.status).toEqual(200)
      await expect(await post.json()).toEqual({ method: 'POST' })
    })
    it('traces undici calls', async () => {
      const [get, post] = await Promise.all([
        fetch(expressHost),
        fetch(expressHost, { method: 'POST' }),
      ])
      await spanExporter.forceFlush()

      const spans = spanExporter.getFinishedSpans()
      const undiciSpans = spans.filter(
        (span) =>
          span.instrumentationScope.name ===
          '@opentelemetry/instrumentation-undici'
      )

      expect(undiciSpans).toHaveLength(2)
      expect(undiciSpans[0]).toEqual(
        expect.objectContaining<Partial<ReadableSpan>>({
          name: 'GET localhost/',
        })
      )
      expect(undiciSpans[1]).toEqual(
        expect.objectContaining<Partial<ReadableSpan>>({
          name: 'POST localhost/',
        })
      )
    })
  })
  describe('redis', () => {
    it('lets requests through', async () => {
      await redisClient.set('key', 'value')
      const value = await redisClient.get('key')
      await redisClient.del('key')

      expect(value).toEqual('value')
    })
  })
  describe('opensearch', () => {
    it('lets requests through', async () => {
      const index = 'test-index'
      await opensearchClient.indices.create({
        index,
        body: {
          mappings: {
            properties: {
              name: { type: 'keyword' },
            },
          },
        },
      })
      await opensearchClient.index({
        index,
        body: {
          name: 'Name',
        },
        refresh: true,
      })
      const doc = await opensearchClient.search({
        index,
        body: {
          query: { match_all: {} },
        },
      })
      await opensearchClient.indices.delete({ index })

      expect(doc.body.hits.hits).toHaveLength(1)
      expect(doc.body.hits.hits[0]._source).toEqual({ name: 'Name' })
    })
    it('traces opensearch calls', async () => {
      const index = 'test-index'
      await opensearchClient.indices.create({
        index,
        body: {
          mappings: {
            properties: {
              name: { type: 'keyword' },
            },
          },
        },
      })
      await opensearchClient.index({
        index,
        body: {
          name: 'Name',
        },
        refresh: true,
      })
      await opensearchClient.search({
        index,
        body: {
          query: { match_all: {} },
        },
      })
      await opensearchClient.indices.delete({ index })
      await spanExporter.forceFlush()

      const spans = spanExporter.getFinishedSpans()
      const opensearchSpans = spans.filter(
        (span) =>
          span.instrumentationScope.name ===
          '@sebspark/opentelemetry-instrumentation-opensearch'
      )

      expect(opensearchSpans).toHaveLength(5)

      expect(opensearchSpans[0].name).toEqual('indices.delete *,-.*')
      expect(opensearchSpans[0].attributes).toMatchObject({
        [ATTR_DB_SYSTEM_NAME]: 'opensearch',
        [ATTR_DB_OPERATION_NAME]: 'indices.delete',
        [ATTR_DB_COLLECTION_NAME]: '*,-.*',
        [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
      })

      expect(opensearchSpans[1].name).toEqual('indices.create test-index')
      expect(opensearchSpans[1].attributes).toMatchObject({
        [ATTR_DB_SYSTEM_NAME]: 'opensearch',
        [ATTR_DB_OPERATION_NAME]: 'indices.create',
        [ATTR_DB_COLLECTION_NAME]: 'test-index',
        [ATTR_DB_QUERY_TEXT]:
          '{"mappings":{"properties":{"name":{"type":"keyword"}}}}',
        [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
      })

      expect(opensearchSpans[2].name).toEqual('index test-index')
      expect(opensearchSpans[2].attributes).toMatchObject({
        [ATTR_DB_SYSTEM_NAME]: 'opensearch',
        [ATTR_DB_OPERATION_NAME]: 'index',
        [ATTR_DB_COLLECTION_NAME]: 'test-index',
        [ATTR_DB_QUERY_TEXT]: '{"name":"Name"}',
        [ATTR_HTTP_RESPONSE_STATUS_CODE]: 201,
      })

      expect(opensearchSpans[3].name).toEqual('search test-index')
      expect(opensearchSpans[3].attributes).toMatchObject({
        [ATTR_DB_SYSTEM_NAME]: 'opensearch',
        [ATTR_DB_OPERATION_NAME]: 'search',
        [ATTR_DB_COLLECTION_NAME]: 'test-index',
        [ATTR_DB_QUERY_TEXT]: '{"query":{"match_all":{}}}',
        [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
      })

      expect(opensearchSpans[4].name).toEqual('indices.delete test-index')
      expect(opensearchSpans[4].attributes).toMatchObject({
        [ATTR_DB_SYSTEM_NAME]: 'opensearch',
        [ATTR_DB_OPERATION_NAME]: 'indices.delete',
        [ATTR_DB_COLLECTION_NAME]: 'test-index',
        [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
      })
    })
  })
})
