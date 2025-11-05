import type {
  APIResponse,
  BaseClient,
  ClientOptions,
  RequestArgs,
  RequestOptions,
} from '@sebspark/openapi-core'
import { fromAxiosError } from '@sebspark/openapi-core'
import { getLogger } from '@sebspark/otel'
import { retry } from '@sebspark/retry'
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import axios from 'axios'
import createAuthRefreshInterceptor from 'axios-auth-refresh'
import { paramsSerializer } from './paramsSerializer'

const createAuthRefreshInterceptorFunc =
  (createAuthRefreshInterceptor as any)?.default ?? createAuthRefreshInterceptor

export type TypedAxiosClient<T> = T & {
  axiosInstance: AxiosInstance
}

export const TypedClient = <C extends Partial<BaseClient>>(
  baseURL: string,
  globalOptions?: ClientOptions
): TypedAxiosClient<C> => {
  const axiosInstance = axios.create()

  const logger = getLogger('TypedClient')

  logger.debug(
    `client initialized with arrayFormat '${globalOptions?.arrayFormat}'`
  )

  if (globalOptions?.authorizationTokenGenerator) {
    logger.debug('authorizationTokenGenerator is set')

    axiosInstance.interceptors.request.use(async (request) => {
      const url = `${request.baseURL}${request.url}`
      logger.debug(`Intercepting request to ${url}`)

      if (globalOptions?.authorizationTokenGenerator && url) {
        try {
          const authorizationTokenHeaders =
            await globalOptions.authorizationTokenGenerator(url)

          if (authorizationTokenHeaders) {
            for (const key of Object.keys(authorizationTokenHeaders)) {
              const value = authorizationTokenHeaders[key]
              logger.debug(`Setting header ${key} to ${value}`)
              request.headers[key] = value
            }
          }
        } catch (error) {
          logger.error(`Error generating token for URL: ${url}`, error as Error)
          throw error
        }
      }

      logger.debug('Intercepted request:')
      logger.debug(JSON.stringify(request, null, 2))
      return request
    })
  }

  if (globalOptions?.authorizationTokenRefresh) {
    const refreshAuthLogic = async (
      // biome-ignore lint/suspicious/noExplicitAny: Defined by dependency
      failedRequest: any
    ): Promise<AxiosResponse> => {
      if (!axios.isAxiosError(failedRequest)) {
        logger.error(
          'Failed request is not an axios error',
          failedRequest as Error
        )
        throw failedRequest
      } else {
        logger.debug('Failed request', failedRequest)
      }

      const axiosError = failedRequest as AxiosError

      logger.debug('Failed request config', axiosError.config)

      const url = `${axiosError.config?.baseURL}${axiosError.config?.url}`
      if (globalOptions?.authorizationTokenRefresh && url) {
        logger.debug(`Refreshing token for URL ${url}`)
        try {
          await globalOptions?.authorizationTokenRefresh(url)
        } catch (error) {
          logger.error(`Error refreshing token for URL: ${url}`, error as Error)
          throw error
        }
      }

      return axiosError.response as AxiosResponse
    }

    createAuthRefreshInterceptorFunc(axiosInstance, refreshAuthLogic)
  }

  if (logger) {
    axiosInstance.interceptors.request.use((request) => {
      const requestObject = {
        url: request.url,
        params: request.params,
        headers: request.headers,
      }
      logger.debug('request', requestObject)
      return request
    })

    axiosInstance.interceptors.response.use((response) => {
      const responseObject = {
        data: response.data,
        config: response.config,
        headers: response.headers,
      }

      logger.debug('response', responseObject)
      return response
    })
  }

  const client: BaseClient = {
    get: (url, args, opts) =>
      callServer(
        axiosInstance,
        mergeArgs(baseURL, url, 'get', args, opts, globalOptions),
        logger
      ),
    post: (url, args, opts) =>
      callServer(
        axiosInstance,
        mergeArgs(baseURL, url, 'post', args, opts, globalOptions),
        logger
      ),
    put: (url, args, opts) =>
      callServer(
        axiosInstance,
        mergeArgs(baseURL, url, 'put', args, opts, globalOptions),
        logger
      ),
    patch: (url, args, opts) =>
      callServer(
        axiosInstance,
        mergeArgs(baseURL, url, 'patch', args, opts, globalOptions),
        logger
      ),
    delete: (url, args, opts) =>
      callServer(
        axiosInstance,
        mergeArgs(baseURL, url, 'delete', args, opts, globalOptions),
        logger
      ),
  }

  return { ...client, axiosInstance } as TypedAxiosClient<C>
}

const callServer = async <
  R extends APIResponse<
    unknown | undefined,
    Record<string, string> | undefined
  >,
>(
  axiosInstance: AxiosInstance,
  args: Partial<ClientOptions & RequestArgs>,
  logger: ReturnType<typeof getLogger>
): Promise<R> => {
  try {
    const serializer = paramsSerializer((args as ClientOptions).arrayFormat)

    logger.debug(`[callServer] typeof serializer: ${typeof serializer}`)

    const body =
      args.method?.toLowerCase() === 'get' ||
      args.method?.toLowerCase() === 'delete'
        ? undefined
        : args.body
    const { headers, data } = await retry(
      () =>
        axiosInstance.request({
          baseURL: args.baseUrl,
          url: args.url,
          method: args.method,
          headers: args.headers as AxiosRequestConfig['headers'],
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
  // biome-ignore lint/suspicious/noExplicitAny: it is any
  ...args: (any | undefined)[]
  // biome-ignore lint/suspicious/noExplicitAny: it is any
): any => Object.assign({}, ...args.map((a) => a?.[prop] || {}))

const setParams = (url: string, params: Record<string, string> = {}): string =>
  Object.entries(params).reduce(
    (url, [key, val]) =>
      url.replace(new RegExp(`/:${key}(?!\\w|\\d)`, 'g'), `/${val}`),
    url
  )
