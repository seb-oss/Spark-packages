import {
  APIServerDefinition,
  APIServerOptions,
  GenericRouteHandler,
  UnauthorizedError,
} from '@sebspark/openapi-core'
import express, { Express } from 'express'
import { SuperAgentTest, agent } from 'supertest'
import { Mock, beforeEach, expect, test, vi } from 'vitest'
import { TypedRouter } from './router'

type User = {
  id: string
}

type Server = APIServerDefinition & {
  '/users': {
    get: {
      handler: () => Promise<[200, User[]]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
  '/users/:id': {
    get: {
      handler: (args: { params: { id: string } }) => Promise<[200, User]>
      pre?: GenericRouteHandler | GenericRouteHandler[]
    }
  }
}

let app: Express
let server: Server
let options: APIServerOptions
let client: SuperAgentTest

beforeEach(() => {
  app = express()

  server = {
    '/users': {
      get: {
        pre: vi.fn().mockImplementation((_req, _res, next) => next()),
        handler: vi.fn().mockResolvedValue([200, []]),
      },
    },
    '/users/:id': {
      get: {
        handler: vi.fn(),
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
  ;(server['/users'].get.handler as Mock).mockResolvedValue([200, users])
  const response = await client.get('/users')
  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual(users)
})

test('/users/:id is called correctly', async () => {
  ;(server['/users/:id'].get.handler as Mock).mockImplementation(
    async ({ params: { id } }) => [200, { id }]
  )
  const response = await client.get('/users/foobar')
  expect(response.statusCode).toEqual(200)
  expect(response.body).toEqual({ id: 'foobar' })
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
