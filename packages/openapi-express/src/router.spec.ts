import {
  ATTR_CLIENT_ADDRESS,
  ATTR_ERROR_TYPE,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_HTTP_ROUTE,
  ATTR_NETWORK_PROTOCOL_VERSION,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_URL_PATH,
  ATTR_URL_QUERY,
  ATTR_URL_SCHEME,
  ATTR_USER_AGENT_ORIGINAL,
  METRIC_HTTP_SERVER_REQUEST_DURATION,
} from '@opentelemetry/semantic-conventions'
import {
  type APIResponse,
  type APIServerDefinition,
  type APIServerOptions,
  type ExpressRequest,
  type GenericRouteHandler,
  type PartiallySerialized,
  UnauthorizedError,
} from '@sebspark/openapi-core'
import { getLogger, getTracer, SpanStatusCode } from '@sebspark/otel'
import express, { type Express } from 'express'
import { type Agent, agent } from 'supertest'
import { beforeEach, describe, expect, type Mocked, test, vi } from 'vitest'
import { TypedRouter } from './router'

vi.mock('@sebspark/otel', () => {
  const SpanStatusCode = { UNSET: 0, OK: 1, ERROR: 2 }
  const logger = {
    alert: vi.fn(),
    critical: vi.fn(),
    debug: vi.fn(),
    emergency: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    notice: vi.fn(),
    warn: vi.fn(),
  }
  const span = {
    setAttribute: vi.fn(),
    setAttributes: vi.fn(),
    setStatus: vi.fn(),
    recordException: vi.fn(),
    end: vi.fn(),
  }
  const tracer = {
    startSpan: vi.fn().mockReturnValue(span),
  }

  return {
    getLogger: vi.fn().mockReturnValue(logger),
    getTracer: vi.fn().mockReturnValue(tracer),
    SpanStatusCode,
  }
})

type User = {
  id: string
}

type Req = ExpressRequest

type Server = APIServerDefinition & {
  '/users': {
    get: {
      handler: (
        args: Req
      ) => Promise<[200, APIResponse<PartiallySerialized<User>[]>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/users/:id': {
    get: {
      handler: (
        args: Req & {
          params: { id: string }
        }
      ) => Promise<[200, APIResponse<PartiallySerialized<User>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/headeronly': {
    get: {
      handler: (
        args: Req
      ) => Promise<[204, APIResponse<undefined, { 'x-foo': 'bar' }>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/headerandbody': {
    get: {
      handler: (
        args: Req
      ) => Promise<
        [204, APIResponse<PartiallySerialized<User>, { 'x-foo': 'bar' }>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/nocontent': {
    get: {
      handler: (args: Req) => Promise<[204, APIResponse<undefined>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

let app: Express
let server: Server
let options: APIServerOptions
let client: Agent
let logger: Mocked<ReturnType<typeof getLogger>>
let tracer: Mocked<ReturnType<typeof getTracer>>
let span: Mocked<ReturnType<typeof tracer.startSpan>>

beforeEach(() => {
  vi.clearAllMocks()

  logger = vi.mocked(getLogger())
  tracer = vi.mocked(getTracer())
  span = vi.mocked(tracer.startSpan(''))

  app = express()

  server = {
    '/users': {
      get: {
        pre: vi.fn().mockImplementation((_req, _res, next) => next()),
        handler: vi.fn().mockResolvedValue([200, { data: [] }]),
      },
    },
    '/users/:id': {
      get: {
        handler: vi.fn(),
      },
    },
    '/headeronly': {
      get: {
        handler: vi
          .fn()
          .mockResolvedValue([204, { headers: { 'x-foo': 'bar' } }]),
      },
    },
    '/headerandbody': {
      get: {
        handler: vi.fn().mockResolvedValue([
          200,
          {
            headers: { 'x-foo': 'bar' },
            data: { id: 'foo' },
          },
        ]),
      },
    },
    '/nocontent': {
      get: {
        handler: vi.fn().mockResolvedValue([204, undefined]),
      },
    },
  } as Server
  options = {
    pre: vi.fn().mockImplementation((_req, _res, next) => next()),
  }
  const router = TypedRouter(server, options)
  app.use('/', router)

  client = agent(app)
})

test('/users is called correctly', async () => {
  const users: User[] = [{ id: 'foo' }, { id: 'bar' }]
  vi.mocked(server['/users'].get.handler).mockResolvedValue([
    200,
    { data: users },
  ])
  const response = await client.get('/users')
  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual(users)
})
test('/users/:id is called correctly', async () => {
  vi.mocked(server['/users/:id'].get.handler).mockImplementation(
    async ({ params: { id } }) => [200, { data: { id } }]
  )
  const response = await client.get('/users/foobar')
  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual({ id: 'foobar' })
})
test('/headeronly sends headers', async () => {
  const response = await client.get('/headeronly')
  expect(response.statusCode).toEqual(204)
  expect(response.header['x-foo']).toEqual('bar')
})
test('/headerandbody sends headers and body', async () => {
  const response = await client.get('/headerandbody')
  expect(response.statusCode).toEqual(200)
  expect(response.header['x-foo']).toEqual('bar')
  expect(response.body).toEqual({ id: 'foo' })
})
test('it runs pre handlers', async () => {
  vi.mocked(server['/users'].get.pre as GenericRouteHandler).mockImplementation(
    (_req, _res, next) => {
      next(new UnauthorizedError())
    }
  )
  const response = await client.get('/users')
  expect(response.unauthorized).toBe(true)
})
test('it runs pre handlers passed as an array', async () => {
  const pre1: GenericRouteHandler = vi
    .fn()
    .mockImplementation((_req, _res, next) => next())
  const pre2: GenericRouteHandler = vi
    .fn()
    .mockImplementation((_req, _res, next) => {
      next(new UnauthorizedError())
    })
  server['/users'].get.pre = [pre1, pre2]
  const testApp = express()
  testApp.use('/', TypedRouter(server, options))
  const response = await agent(testApp).get('/users')
  expect(pre1).toHaveBeenCalled()
  expect(response.unauthorized).toBe(true)
})
test('it runs pre usings', async () => {
  vi.mocked(options.pre as GenericRouteHandler).mockImplementation(
    async (_req, _res, next) => {
      next(new UnauthorizedError())
    }
  )
  const response = await client.get('/users')
  expect(response.unauthorized).toBe(true)
})
test('it runs pre usings passed as an array', async () => {
  const pre1: GenericRouteHandler = vi
    .fn()
    .mockImplementation((_req, _res, next) => next())
  const pre2: GenericRouteHandler = vi
    .fn()
    .mockImplementation((_req, _res, next) => {
      next(new UnauthorizedError())
    })
  const router = TypedRouter(server, { pre: [pre1, pre2] })
  const testApp = express()
  testApp.use('/', router)
  const response = await agent(testApp).get('/users')
  expect(pre1).toHaveBeenCalled()
  expect(response.unauthorized).toBe(true)
})
test('it handles errors correctly', async () => {
  const err = new Error('error')
  vi.mocked(server['/users'].get.handler).mockImplementation(async () => {
    throw err
  })
  const { body, error } = await client.get('/users')
  expect(error).toBeInstanceOf(Error)
  expect(body.message).toEqual('Internal Server Error')
})
test('it handles a thrown string correctly', async () => {
  vi.mocked(server['/users'].get.handler).mockImplementation(async () => {
    throw 'something went wrong'
  })
  const { body } = await client.get('/users')
  expect(body.message).toEqual('Internal Server Error')
})
test('it handles a thrown plain object correctly', async () => {
  vi.mocked(server['/users'].get.handler).mockImplementation(async () => {
    throw { code: 'OOPS' }
  })
  const { body } = await client.get('/users')
  expect(body.message).toEqual('Internal Server Error')
})
test('/nocontent is called correctly', async () => {
  vi.mocked(server['/nocontent'].get.handler).mockResolvedValue([204, {}])
  const response = await client.get('/nocontent')
  expect(response.statusCode).toEqual(204)
  expect(response.body).toEqual({})
})
test('ends the response with no body when handler returns a falsy response', async () => {
  // biome-ignore lint/suspicious/noExplicitAny: testing falsy response branch
  vi.mocked(server['/nocontent'].get.handler).mockResolvedValue([
    204,
    undefined as any,
  ])
  const response = await client.get('/nocontent')
  expect(response.statusCode).toEqual(204)
  expect(response.body).toEqual({})
})
describe('tracing and logging', () => {
  test('initialises logger and tracer with the package name', async () => {
    await client.get('/users')
    expect(vi.mocked(getLogger)).toHaveBeenCalledWith(
      '@sebspark/openapi-express'
    )
    expect(vi.mocked(getTracer)).toHaveBeenCalledWith(
      '@sebspark/openapi-express'
    )
  })
  test('starts a span named "METHOD /route"', async () => {
    await client.get('/users')
    expect(tracer.startSpan).toHaveBeenCalledWith('GET /users')
  })
  test('sets request attributes on the span', async () => {
    await client.get('/users?foo=bar').set('user-agent', 'test-agent/1.0')
    expect(span.setAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        [ATTR_HTTP_REQUEST_METHOD]: 'GET',
        [ATTR_HTTP_ROUTE]: '/users',
        [ATTR_URL_PATH]: '/users',
        [ATTR_URL_QUERY]: 'foo=bar',
        [ATTR_URL_SCHEME]: expect.any(String),
        [ATTR_SERVER_ADDRESS]: expect.any(String),
        [ATTR_SERVER_PORT]: expect.any(Number),
        [ATTR_NETWORK_PROTOCOL_VERSION]: expect.any(String),
        [ATTR_CLIENT_ADDRESS]: expect.any(String),
        [ATTR_USER_AGENT_ORIGINAL]: 'test-agent/1.0',
      })
    )
  })
  test('sets OK status and response code on success', async () => {
    await client.get('/users')
    expect(span.setAttributes).toHaveBeenCalledWith({
      [ATTR_HTTP_RESPONSE_STATUS_CODE]: 200,
    })
    expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK })
    expect(span.end).toHaveBeenCalledTimes(1)
  })
  test('logs info on success', async () => {
    await client.get('/users')
    expect(logger.info).toHaveBeenCalledWith(
      'GET /users 200',
      expect.any(Object)
    )
  })
  test('wraps a non-Error thrown value into an Error before recording it', async () => {
    vi.mocked(server['/users'].get.handler).mockRejectedValue('boom')
    await client.get('/users')
    expect(span.recordException).toHaveBeenCalledWith(expect.any(Error))
    expect(span.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ code: SpanStatusCode.ERROR })
    )
  })
  test('records exception and sets ERROR status on handler error', async () => {
    const err = new Error('boom')
    vi.mocked(server['/users'].get.handler).mockRejectedValue(err)
    await client.get('/users')
    expect(span.recordException).toHaveBeenCalledWith(err)
    expect(span.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: 'boom',
    })
    expect(span.setAttribute).toHaveBeenCalledWith(ATTR_ERROR_TYPE, 'Error')
    expect(span.end).toHaveBeenCalledTimes(1)
  })
  test('sets http.response.status_code on the span when the error has a statusCode', async () => {
    vi.mocked(server['/users'].get.handler).mockRejectedValue(
      new UnauthorizedError()
    )
    await client.get('/users')
    expect(span.setAttributes).toHaveBeenCalledWith({
      [ATTR_HTTP_RESPONSE_STATUS_CODE]: 401,
    })
  })
  test('logs error on handler error', async () => {
    const err = new Error('boom')
    vi.mocked(server['/users'].get.handler).mockRejectedValue(err)
    await client.get('/users')
    expect(logger.error).toHaveBeenCalledWith(
      'GET /users',
      err,
      expect.any(Object)
    )
  })
  test('sets http.server.request.duration on the span in seconds', async () => {
    await client.get('/users')
    expect(span.setAttribute).toHaveBeenCalledWith(
      METRIC_HTTP_SERVER_REQUEST_DURATION,
      expect.any(Number)
    )
  })
  test('includes duration in the info log on success', async () => {
    await client.get('/users')
    expect(logger.info).toHaveBeenCalledWith(
      'GET /users 200',
      expect.objectContaining({
        [METRIC_HTTP_SERVER_REQUEST_DURATION]: expect.any(Number),
      })
    )
  })
  test('includes duration in the error log on failure', async () => {
    const err = new Error('boom')
    vi.mocked(server['/users'].get.handler).mockRejectedValue(err)
    await client.get('/users')
    expect(logger.error).toHaveBeenCalledWith(
      'GET /users',
      err,
      expect.objectContaining({
        [METRIC_HTTP_SERVER_REQUEST_DURATION]: expect.any(Number),
      })
    )
  })
  test('includes http attributes in the info log on success', async () => {
    await client.get('/users?foo=bar').set('user-agent', 'test-agent/1.0')
    expect(logger.info).toHaveBeenCalledWith(
      'GET /users 200',
      expect.objectContaining({
        [ATTR_HTTP_REQUEST_METHOD]: 'GET',
        [ATTR_HTTP_ROUTE]: '/users',
        [ATTR_URL_PATH]: '/users',
        [ATTR_URL_QUERY]: 'foo=bar',
        [ATTR_URL_SCHEME]: expect.any(String),
        [ATTR_SERVER_ADDRESS]: expect.any(String),
        [ATTR_SERVER_PORT]: expect.any(Number),
        [ATTR_NETWORK_PROTOCOL_VERSION]: expect.any(String),
        [ATTR_CLIENT_ADDRESS]: expect.any(String),
        [ATTR_USER_AGENT_ORIGINAL]: 'test-agent/1.0',
      })
    )
  })
  test('includes http attributes in the error log on failure', async () => {
    const err = new Error('boom')
    vi.mocked(server['/users'].get.handler).mockRejectedValue(err)
    await client.get('/users?foo=bar').set('user-agent', 'test-agent/1.0')
    expect(logger.error).toHaveBeenCalledWith(
      'GET /users',
      err,
      expect.objectContaining({
        [ATTR_HTTP_REQUEST_METHOD]: 'GET',
        [ATTR_HTTP_ROUTE]: '/users',
        [ATTR_URL_PATH]: '/users',
        [ATTR_URL_QUERY]: 'foo=bar',
        [ATTR_URL_SCHEME]: expect.any(String),
        [ATTR_SERVER_ADDRESS]: expect.any(String),
        [ATTR_SERVER_PORT]: expect.any(Number),
        [ATTR_NETWORK_PROTOCOL_VERSION]: expect.any(String),
        [ATTR_CLIENT_ADDRESS]: expect.any(String),
        [ATTR_USER_AGENT_ORIGINAL]: 'test-agent/1.0',
      })
    )
  })
})

describe('log label uses route template, not actual path', () => {
  type AssetServer = APIServerDefinition & {
    '/assets': { get: { handler: GenericRouteHandler } }
    '/assets/:id': { get: { handler: GenericRouteHandler } }
  }
  let assetClient: Agent

  beforeEach(() => {
    const assetServer: AssetServer = {
      '/assets': {
        get: { handler: vi.fn().mockResolvedValue([200, { data: [] }]) },
      },
      '/assets/:id': {
        get: {
          handler: vi.fn().mockResolvedValue([200, { data: { id: 'foo' } }]),
        },
      },
    }
    const testApp = express()
    testApp.use('/', TypedRouter(assetServer))
    assetClient = agent(testApp)
  })
  test('GET /assets is logged as "GET /assets 200"', async () => {
    await assetClient.get('/assets')
    expect(logger.info).toHaveBeenCalledWith(
      'GET /assets 200',
      expect.any(Object)
    )
  })
  test('GET /assets/STO_SE0000120784_SEK_XSTO is logged as "GET /assets/:id 200"', async () => {
    await assetClient.get('/assets/STO_SE0000120784_SEK_XSTO')
    expect(logger.info).toHaveBeenCalledWith(
      'GET /assets/:id 200',
      expect.any(Object)
    )
  })
})
