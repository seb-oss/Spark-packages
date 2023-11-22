/* eslint-disable @typescript-eslint/no-explicit-any */
import { RetrySettings } from '@sebspark/retry'
import type { NextFunction, Request, Response } from 'express'

export type Verb = 'get' | 'post' | 'put' | 'patch' | 'delete'
export type GenericRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>
export type RouteHandler = {
  pre?: GenericRouteHandler | GenericRouteHandler[]
  // biome-ignore lint/suspicious/noExplicitAny: Allow any
  handler: <A = any, R = any>(arg?: A) => Promise<R>
}
export type Route<R extends RouteHandler = RouteHandler> = Record<Verb, R>
export type APIServerDefinition = Record<string, Partial<Route>>
export type APIServerOptions = {
  pre?: GenericRouteHandler | GenericRouteHandler[]
}

export type RequestArgs = Request & {
  params?: Record<string, string>
  query?: Record<string, string>
  headers?: Record<string, string>
}
export type PayloadRequestArgs = RequestArgs & {
  body?: Record<string, string>
}

export type RequestOptions = {
  retry: RetrySettings
}

export type ClientOptions = RequestOptions & {
  //
}

export type BaseClient = {
  get: <U extends string, A extends RequestArgs | never, R>(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
  post: <U extends string, A extends PayloadRequestArgs | never, R>(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
  put: <U extends string, A extends PayloadRequestArgs | never, R>(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
  patch: <U extends string, A extends PayloadRequestArgs | never, R>(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
  delete: <U extends string, A extends RequestArgs | never, R>(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
}
