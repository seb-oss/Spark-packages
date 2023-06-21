/* eslint-disable complexity */
/* eslint-disable max-lines */
import { NextFunction, Request, Response, Router } from 'express'

// TODO: Figure out how to break apart
// import { AuthenticatedRequest } from './server'
// import { AuthenticatedUser } from '@sebneo/server/auth'
type AuthenticatedUser = unknown
type AuthenticatedRequest = Request & {
  user: AuthenticatedUser,
}

export type ResponseType = [number, unknown]

export type TypedRoute<
  RequestParams,
  RequestQuery,
  RequestHeaders,
  RequestBody,
  Response extends ResponseType,
  ErrorResponse extends ResponseType
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
      stuff: RouteStuff<
        R[T]['requestQuery'],
        R[T]['requestParams'],
        R[T]['requestHeaders'],
        R[T]['requestBody'],
        R[T]['response'][1]
      >
    ) => Promise<R[T]['response'] | R[T]['error']>
  ) => {
    const handler = async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
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
        return router.get(strPath, handler)
      case 'POST':
        return router.post(strPath, handler)
      case 'PUT':
        return router.put(strPath, handler)
      case 'PATCH':
        return router.patch(strPath, handler)
      case 'DELETE':
        return router.delete(strPath, handler)
    }
  }
  return customHandler
}

export const TypedRouter = <R extends RouteDefinitions>() => {
  const expressRouter = Router()
  return {
    expressRouter,
    get: abstractedHandler<R['get']>(expressRouter, 'GET'),
    post: abstractedHandler<R['post']>(expressRouter, 'POST'),
    put: abstractedHandler<R['put']>(expressRouter, 'PUT'),
    patch: abstractedHandler<R['patch']>(expressRouter, 'PATCH'),
    delete: abstractedHandler<R['delete']>(expressRouter, 'DELETE'),
  }
}

type RouteStuff<Q, P, H, Req, Res> = {
  user: AuthenticatedUser
  queryParams: Q
  pathParams: P
  headers: H
  body: Req
  request: Request<P, Res, Req, Q>
}
