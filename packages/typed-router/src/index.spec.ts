import { expect, test, vi } from 'vitest'
import { type TypedRoute, TypedRouter } from './index'

const { request, response, next } = vi.hoisted(() => {
  const request = {
    headers: {},
    query: {},
    params: {},
    body: {},
    user: {},
  }
  const response = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  const next = vi.fn()

  return {
    request,
    response,
    next,
  }
})

vi.mock('express', () => ({
  Router: vi.fn().mockReturnValue({
    get: vi.fn().mockImplementation(async (_path, fn) => {
      await fn(request, response, next)
    }),
    post: vi.fn().mockImplementation(async (_path, fn) => {
      await fn(request, response, next)
    }),
    put: vi.fn().mockImplementation(async (_path, fn) => {
      await fn(request, response, next)
    }),
    patch: vi.fn().mockImplementation(async (_path, fn) => {
      await fn(request, response, next)
    }),
    delete: vi.fn().mockImplementation(async (_path, fn) => {
      await fn(request, response, next)
    }),
  }),
}))

type TestRouteDefinitions = {
  get: {
    '/test': TypedRoute<
      never,
      never,
      never,
      never,
      [200, string],
      [400, Error] | [500, Error]
    >
  }
}

test('calls handler function and returns correct response', async () => {
  const router = TypedRouter<TestRouteDefinitions>()
  const handler = vi.fn().mockResolvedValue([200, 'hello'])

  // Await to ensure that the handler has been called
  // and responded
  await router.get('/test', handler)

  expect(handler).toHaveBeenCalledWith({
    pathParams: request.params,
    queryParams: request.query,
    headers: request.headers,
    body: request.body,
    user: request.user,
    request,
  })

  expect(response.status).toHaveBeenCalledWith(200)
  expect(response.send).toHaveBeenCalledWith('hello')
})

test('calls next with error when handler throws', async () => {
  const router = TypedRouter<TestRouteDefinitions>()
  const error = new Error('oops')
  const handler = vi.fn().mockRejectedValue(error)

  await router.get('/test', handler)

  expect(next).toHaveBeenCalledWith(error)
})

test('registers POST route', async () => {
  type PostRoutes = {
    post: {
      '/test': TypedRoute<
        never,
        never,
        never,
        never,
        [200, string],
        [400, Error]
      >
    }
  }
  const router = TypedRouter<PostRoutes>()
  const handler = vi.fn().mockResolvedValue([200, 'created'])

  await router.post('/test', handler)

  expect(response.status).toHaveBeenCalledWith(200)
})

test('registers PUT route', async () => {
  type PutRoutes = {
    put: {
      '/test': TypedRoute<
        never,
        never,
        never,
        never,
        [200, string],
        [400, Error]
      >
    }
  }
  const router = TypedRouter<PutRoutes>()
  const handler = vi.fn().mockResolvedValue([200, 'updated'])

  await router.put('/test', handler)

  expect(response.status).toHaveBeenCalledWith(200)
})

test('registers PATCH route', async () => {
  type PatchRoutes = {
    patch: {
      '/test': TypedRoute<
        never,
        never,
        never,
        never,
        [200, string],
        [400, Error]
      >
    }
  }
  const router = TypedRouter<PatchRoutes>()
  const handler = vi.fn().mockResolvedValue([200, 'patched'])

  await router.patch('/test', handler)

  expect(response.status).toHaveBeenCalledWith(200)
})

test('registers DELETE route', async () => {
  type DeleteRoutes = {
    delete: {
      '/test': TypedRoute<
        never,
        never,
        never,
        never,
        [200, string],
        [400, Error]
      >
    }
  }
  const router = TypedRouter<DeleteRoutes>()
  const handler = vi.fn().mockResolvedValue([200, 'deleted'])

  await router.delete('/test', handler)

  expect(response.status).toHaveBeenCalledWith(200)
})
