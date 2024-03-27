import type { OutgoingHttpHeaders } from 'node:http'
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RetrySettings } from '@sebspark/retry'
import type { NextFunction, Request, Response } from 'express'
import type {
  Empty,
  LowerCaseHeaders,
  PartiallySerialized,
  Serialized,
} from './ts-extensions'

export type { PartiallySerialized, Serialized, LowerCaseHeaders }

export type Verb = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type APIResponse<
  Data = undefined,
  Headers = undefined,
> = Data extends undefined
  ? Headers extends undefined
    ? Empty
    : { headers: Headers }
  : Headers extends undefined
    ? { data: Data }
    : { data: Data; headers: Headers }

export type GenericRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>
export type RouteHandler = {
  pre?: GenericRouteHandler | GenericRouteHandler[]
  handler: <
    RequestArgs,
    Response extends [
      number,
      APIResponse<unknown | undefined, Record<string, string> | undefined>,
    ],
  >(
    args?: RequestArgs
  ) => Promise<Response>
}
export type Route<Handler extends RouteHandler = RouteHandler> = Record<
  Verb,
  Handler
>
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
  retry?: RetrySettings
  headers?: OutgoingHttpHeaders & Record<string, string>
}

export type ArrayFormat = 'indices' | 'brackets' | 'repeat' | 'comma'

export type ClientOptions = RequestOptions & {
  arrayFormat?: ArrayFormat
}

export type BaseClient = {
  get: <
    U extends string,
    A extends RequestArgs | never,
    R extends APIResponse<
      unknown | undefined,
      Record<string, string> | undefined
    >,
  >(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
  post: <
    U extends string,
    A extends PayloadRequestArgs | never,
    R extends APIResponse<
      unknown | undefined,
      Record<string, string> | undefined
    >,
  >(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
  put: <
    U extends string,
    A extends PayloadRequestArgs | never,
    R extends APIResponse<
      unknown | undefined,
      Record<string, string> | undefined
    >,
  >(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
  patch: <
    U extends string,
    A extends PayloadRequestArgs | never,
    R extends APIResponse<
      unknown | undefined,
      Record<string, string> | undefined
    >,
  >(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
  delete: <
    U extends string,
    A extends RequestArgs | never,
    R extends APIResponse<unknown, unknown>,
  >(
    url: U,
    args?: A,
    opts?: RequestOptions
  ) => Promise<R>
}
