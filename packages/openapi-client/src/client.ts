import {
  type APIResponse,
  type BaseClient,
  type ClientOptions,
  type RequestArgs,
  type RequestOptions,
  fromAxiosError,
} from '@sebspark/openapi-core'
import { retry } from '@sebspark/retry'
import axios, { type AxiosError, type AxiosHeaders } from 'axios'
import type { Logger } from 'winston'
import { paramsSerializer } from './paramsSerializer'

export const TypedClient = <C extends Partial<BaseClient>>(
  baseURL: string,
  globalOptions?: ClientOptions,
  logger?: Logger
): C => {
  if (logger) {
    axios.interceptors.request.use((request) => {
      const requestObject = {
        url: request.url,
        params: request.params,
        headers: request.headers,
      }
      logger.debug(JSON.stringify(requestObject, null, 2))
      return request
    })

    axios.interceptors.response.use((response) => {
      const responseObject = {
        data: response.data,
        config: response.config,
        headers: response.headers,
      }

      logger.debug(JSON.stringify(responseObject, null, 2))
      return response
    })
  }
  const client: BaseClient = {
    get: (url, args, opts) =>
      callServer(mergeArgs(baseURL, url, 'get', args, opts, globalOptions)),
    post: (url, args, opts) =>
      callServer(mergeArgs(baseURL, url, 'post', args, opts, globalOptions)),
    put: (url, args, opts) =>
      callServer(mergeArgs(baseURL, url, 'put', args, opts, globalOptions)),
    patch: (url, args, opts) =>
      callServer(mergeArgs(baseURL, url, 'patch', args, opts, globalOptions)),
    delete: (url, args, opts) =>
      callServer(mergeArgs(baseURL, url, 'delete', args, opts, globalOptions)),
  }
  return client as C
}

const callServer = async <
  R extends APIResponse<
    unknown | undefined,
    Record<string, string> | undefined
  >,
>(
  args: Partial<ClientOptions & RequestArgs>
): Promise<R> => {
  try {
    const serializer = paramsSerializer((args as ClientOptions).arrayFormat)
    const body =
      args.method?.toLowerCase() === 'get' ||
      args.method?.toLowerCase() === 'delete'
        ? undefined
        : args.body
    const { headers, data } = await retry(
      () =>
        axios.request({
          baseURL: args.baseUrl,
          url: args.url,
          method: args.method,
          headers: args.headers as AxiosHeaders,
          params: args.params,
          paramsSerializer: serializer,
          data: body,
          httpsAgent: args.httpsAgent,
          httpAgent: args.httpAgent,
        }),
      args.retry
    )
    return { headers, data } as R
  } catch (error) {
    throw fromAxiosError(error as AxiosError)
  }
}

const mergeArgs = (
  baseUrl: string,
  url: string,
  method: string,
  requestArgs: RequestArgs | RequestOptions | undefined,
  extras: RequestOptions | undefined,
  global: ClientOptions | undefined
): Partial<ClientOptions & RequestArgs> => {
  const params = merge('params', global, requestArgs, extras)
  const query = merge('query', global, requestArgs, extras)
  const headers = merge('headers', global, requestArgs, extras)
  const body = merge('body', global, requestArgs, extras)
  const retry = merge('retry', global, requestArgs, extras)
  const merged: Partial<ClientOptions & RequestArgs> = {
    url: setParams(url, params),
    baseUrl,
    method,
    params: query,
    headers,
    body,
    retry,
    arrayFormat: global?.arrayFormat,
    httpsAgent: extras?.httpsAgent,
    httpAgent: extras?.httpAgent,
  }

  return merged
}

const merge = (
  prop: keyof (ClientOptions & RequestArgs),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  ...args: (any | undefined)[]
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
): any => Object.assign({}, ...args.map((a) => a?.[prop] || {}))

const setParams = (url: string, params: Record<string, string> = {}): string =>
  Object.entries(params).reduce(
    (url, [key, val]) =>
      url.replace(new RegExp(`/:${key}(?!\\w|\\d)`, 'g'), `/${val}`),
    url
  )
