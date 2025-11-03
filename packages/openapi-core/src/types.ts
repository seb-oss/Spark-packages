import type { OutgoingHttpHeaders } from 'node:http'
import type { RetrySettings } from '@sebspark/retry'
import type { Request, RequestHandler } from 'express-serve-static-core'
import type {
  Empty,
  LowerCaseHeaders,
  PartiallySerialized,
  QueryParams,
  Serialized,
} from './ts-extensions'

export type { PartiallySerialized, Serialized, LowerCaseHeaders, QueryParams }

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

// For backwards compatibility
export type GenericRouteHandler = RequestHandler

export type RouteHandler = {
  pre?: RequestHandler | RequestHandler[]
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
  pre?: RequestHandler | RequestHandler[]
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
  // biome-ignore lint/suspicious/noExplicitAny: ignore
  httpsAgent?: any
  // biome-ignore lint/suspicious/noExplicitAny: ignore
  httpAgent?: any
  timeout?: number
}

export type ArrayFormat = 'indices' | 'brackets' | 'repeat' | 'comma'

export type ClientOptions = RequestOptions & {
  arrayFormat?: ArrayFormat
  authorizationTokenGenerator?: (
    url: string
  ) => Promise<Record<string, string>> | undefined
  authorizationTokenRefresh?: (url: string) => Promise<void> | undefined
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
