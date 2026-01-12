import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
  Router,
} from 'express'

export type ResponseType = [number, unknown]

export type TypedRoute<
  RequestParams,
  RequestQuery,
  RequestHeaders,
  RequestBody,
  Response extends ResponseType,
  ErrorResponse extends ResponseType,
> = {
  requestParams: RequestParams
  requestBody: RequestBody
  requestQuery: RequestQuery
  requestHeaders: RequestHeaders
  response: Response
  error: ErrorResponse
}

type MethodDefinition = {
  [key: string]: TypedRoute<
    unknown,
    unknown,
    unknown,
    unknown,
    [number, unknown],
    [number, unknown]
  >
}

export type RouteDefinitions = Partial<{
  get: MethodDefinition
  post: MethodDefinition
  put: MethodDefinition
  patch: MethodDefinition
  delete: MethodDefinition
}>

const abstractedHandler = <R extends MethodDefinition>(
  router: Router,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
) => {
  const customHandler = <T extends keyof R>(
    path: T,
    fn: (
      args: RouteArguments<
        R[T]['requestQuery'],
        R[T]['requestParams'],
        R[T]['requestHeaders'],
        R[T]['requestBody']
      >
    ) => Promise<R[T]['response'] | R[T]['error']>
  ) => {
    const handler = async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await fn({
          user: req.user,
          queryParams: req.query,
          headers: req.headers,
          pathParams: req.params,
          body: req.body,
          request: req,
        })
        res.status(result[0]).send(result[1])
      } catch (e) {
        next(e)
      }
    }

    const strPath = path as string

    switch (method) {
      case 'GET':
        return router.get(strPath, handler as RequestHandler)
      case 'POST':
        return router.post(strPath, handler as RequestHandler)
      case 'PUT':
        return router.put(strPath, handler as RequestHandler)
      case 'PATCH':
        return router.patch(strPath, handler as RequestHandler)
      case 'DELETE':
        return router.delete(strPath, handler as RequestHandler)
    }
  }

  return customHandler
}

export interface TypedRouter<R extends RouteDefinitions> {
  expressRouter: Router
  get: ReturnType<typeof abstractedHandler<NonNullable<R['get']>>>
  post: ReturnType<typeof abstractedHandler<NonNullable<R['post']>>>
  put: ReturnType<typeof abstractedHandler<NonNullable<R['put']>>>
  patch: ReturnType<typeof abstractedHandler<NonNullable<R['patch']>>>
  delete: ReturnType<typeof abstractedHandler<NonNullable<R['delete']>>>
}

export const TypedRouter = <R extends RouteDefinitions>(): TypedRouter<R> => {
  const expressRouter = Router()

  return {
    expressRouter,
    get: abstractedHandler<NonNullable<R['get']>>(expressRouter, 'GET'),
    post: abstractedHandler<NonNullable<R['post']>>(expressRouter, 'POST'),
    put: abstractedHandler<NonNullable<R['put']>>(expressRouter, 'PUT'),
    patch: abstractedHandler<NonNullable<R['patch']>>(expressRouter, 'PATCH'),
    delete: abstractedHandler<NonNullable<R['delete']>>(
      expressRouter,
      'DELETE'
    ),
  }
}

type RouteArguments<QueryParams, PathParams, Headers, Body> = {
  user: AuthenticatedUser
  queryParams: QueryParams
  pathParams: PathParams
  headers: Headers
  body: Body
  request: Request
}
