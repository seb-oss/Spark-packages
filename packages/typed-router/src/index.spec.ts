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
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
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
