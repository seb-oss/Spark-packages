import {
  type APIResponse,
  type APIServerDefinition,
  type APIServerOptions,
  type GenericRouteHandler,
  type PartiallySerialized,
  UnauthorizedError,
} from '@sebspark/openapi-core'
import express, { type Express } from 'express'
import { type Agent, agent } from 'supertest'
import { beforeEach, describe, expect, type Mock, test, vi } from 'vitest'
import { TypedRouter } from './router'

const { mockSpan, mockLogger, SpanStatusCode } = vi.hoisted(() => {
  const mockSpan = {
    setAttributes: vi.fn(),
    setAttribute: vi.fn(),
    setStatus: vi.fn(),
    recordException: vi.fn(),
    end: vi.fn(),
  }
  const mockLogger = { info: vi.fn(), error: vi.fn() }
  const SpanStatusCode = { OK: 1, ERROR: 2 }
  return { mockSpan, mockLogger, SpanStatusCode }
})

vi.mock('@sebspark/otel', () => ({
  SpanStatusCode,
  getTracer: vi
    .fn()
    .mockReturnValue({ startSpan: vi.fn().mockReturnValue(mockSpan) }),
  getLogger: vi.fn().mockReturnValue(mockLogger),
}))

type User = {
  id: string
}

type Server = APIServerDefinition & {
  '/users': {
    get: {
      handler: () => Promise<[200, APIResponse<PartiallySerialized<User>[]>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/users/:id': {
    get: {
      handler: (args: {
        params: { id: string }
      }) => Promise<[200, APIResponse<PartiallySerialized<User>>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/headeronly': {
    get: {
      handler: () => Promise<[204, APIResponse<undefined, { 'x-foo': 'bar' }>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/headerandbody': {
    get: {
      handler: () => Promise<
        [204, APIResponse<PartiallySerialized<User>, { 'x-foo': 'bar' }>]
      >
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/nocontent': {
    get: {
      handler: () => Promise<[204, APIResponse<undefined>]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

let app: Express
let server: Server
let options: APIServerOptions
let client: Agent

beforeEach(() => {
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
  ;(server['/users'].get.handler as Mock).mockResolvedValue([
    200,
    { data: users },
  ])
  const response = await client.get('/users')
  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual(users)
})

test('/users/:id is called correctly', async () => {
  ;(server['/users/:id'].get.handler as Mock).mockImplementation(
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
  ;(server['/users'].get.pre as Mock).mockImplementation((_req, _res, next) => {
    next(new UnauthorizedError())
  })

  const response = await client.get('/users')
  expect(response.unauthorized).toBe(true)
})

test('it runs pre usings', async () => {
  ;(options.pre as Mock).mockImplementation(async (_req, _res, next) => {
    next(new UnauthorizedError())
  })
  const response = await client.get('/users')
  expect(response.unauthorized).toBe(true)
})

test('it handles errors correctly', async () => {
  const err = new Error('error')
  ;(server['/users'].get.handler as Mock).mockImplementation(async () => {
    throw err
  })
  const { body, error } = await client.get('/users')
  expect(error).toBeInstanceOf(Error)
  expect(body.message).toEqual('Internal Server Error')
})

test('/nocontent is called correctly', async () => {
  ;(server['/nocontent'].get.handler as Mock).mockResolvedValue([
    204,
    undefined,
  ])
  const response = await client.get('/nocontent')
  expect(response.statusCode).toEqual(204)
  expect(response.body).toEqual({})
})

describe('tracing and logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // restore return values cleared by clearAllMocks
    ;(server['/users'].get.handler as Mock).mockResolvedValue([
      200,
      { data: [] },
    ])
  })

  test('starts a span with method and route template', async () => {
    await client.get('/users')
    expect(mockSpan.setAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        'http.request.method': 'GET',
        'http.route': '/users',
      })
    )
  })

  test('sets OK status and response code on success', async () => {
    await client.get('/users')
    expect(mockSpan.setAttributes).toHaveBeenCalledWith({
      'http.response.status_code': 200,
    })
    expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK })
    expect(mockSpan.end).toHaveBeenCalledTimes(1)
  })

  test('logs info on success', async () => {
    await client.get('/users')
    expect(mockLogger.info).toHaveBeenCalledWith('GET /users 200')
  })

  test('records exception and sets ERROR status on handler error', async () => {
    const err = new Error('boom')
    ;(server['/users'].get.handler as Mock).mockRejectedValue(err)
    await client.get('/users')
    expect(mockSpan.recordException).toHaveBeenCalledWith(err)
    expect(mockSpan.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: 'boom',
    })
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('error.type', 'Error')
    expect(mockSpan.end).toHaveBeenCalledTimes(1)
  })

  test('logs error on handler error', async () => {
    const err = new Error('boom')
    ;(server['/users'].get.handler as Mock).mockRejectedValue(err)
    await client.get('/users')
    expect(mockLogger.error).toHaveBeenCalledWith('GET /users', err)
  })
})
