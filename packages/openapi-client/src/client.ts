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
import type { AxiosInstance, AxiosResponse } from 'axios'
import axios from 'axios'
import { createAuthRefreshInterceptor } from 'axios-auth-refresh'
import { paramsSerializer } from './paramsSerializer'
import { toError } from './toError'

type MergedArgs = Omit<ClientOptions, 'headers'> &
  Omit<RequestArgs, 'params'> & {
    url: string
    baseUrl: string
    method: string
    params?: Record<string, string>
    body?: unknown
  }

export type TypedAxiosClient<T> = T & {
  axiosInstance: AxiosInstance
}

export const TypedClient = <C extends Partial<BaseClient>>(
  baseURL: string,
  globalOptions?: ClientOptions
): TypedAxiosClient<C> => {
  const axiosInstance = axios.create()

  const logger = getLogger('TypedClient')

  if (globalOptions?.authorizationTokenGenerator) {
    logger.debug('authorizationTokenGenerator is set')

    axiosInstance.interceptors.request.use(async (request) => {
      const url = `${request.baseURL}${request.url}`
      logger.debug(`Intercepting request to ${url}`)

      /* istanbul ignore else */
      if (globalOptions?.authorizationTokenGenerator && url) {
        try {
          const authorizationTokenHeaders =
            await globalOptions.authorizationTokenGenerator(url)

          if (authorizationTokenHeaders) {
            for (const key of Object.keys(authorizationTokenHeaders)) {
              const value = authorizationTokenHeaders[key]
              request.headers[key] = value
            }
          }
        } catch (error) {
          logger.error(`Error generating token for URL: ${url}`, toError(error))
          throw error
        }
      }
      return request
    })
  }

  if (globalOptions?.authorizationTokenRefresh) {
    const refreshAuthLogic = async (
      failedRequest: unknown
    ): Promise<AxiosResponse | undefined> => {
      /* istanbul ignore if */
      if (!axios.isAxiosError(failedRequest)) {
        logger.error(
          'Failed request is not an axios error',
          toError(failedRequest)
        )
        throw failedRequest
      }
      logger.debug('Failed request', failedRequest)
      logger.debug('Failed request config', failedRequest.config)

      /* istanbul ignore next */
      const url = `${failedRequest.config?.baseURL}${failedRequest.config?.url}`
      /* istanbul ignore else */
      if (globalOptions?.authorizationTokenRefresh && url) {
        logger.debug(`Refreshing token for URL ${url}`)
        try {
          await globalOptions.authorizationTokenRefresh(url)
        } catch (error) {
          logger.error(`Error refreshing token for URL: ${url}`, toError(error))
          throw error
        }
      }

      return failedRequest.response
    }

    createAuthRefreshInterceptor(axiosInstance, refreshAuthLogic)
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

  // biome-ignore lint/plugin/no-type-assertion: C is the generated typed facade over the untyped BaseClient routes
  return { ...client, axiosInstance } as TypedAxiosClient<C>
}

const callServer = async <
  R extends APIResponse<
    unknown | undefined,
    Record<string, string> | undefined
  >,
>(
  axiosInstance: AxiosInstance,
  args: MergedArgs,
  _logger: ReturnType<typeof getLogger>
): Promise<R> => {
  try {
    const serializer = paramsSerializer(args.arrayFormat)

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
          timeout: args.timeout,
          headers: args.headers,
          params: args.params,
          paramsSerializer: serializer,
          data: body,
          httpsAgent: args.httpsAgent,
          httpAgent: args.httpAgent,
        }),
      args.retry
    )
    // biome-ignore lint/plugin/no-type-assertion: response bodies are trusted to match the OpenAPI spec; they are not validated at runtime
    return { headers, data } as R
  } catch (error) {
    throw fromAxiosError(error)
  }
}

const mergeArgs = (
  baseUrl: string,
  url: string,
  method: string,
  requestArgs: RequestArgs | RequestOptions | undefined,
  extras: RequestOptions | undefined,
  global: ClientOptions | undefined
): MergedArgs => {
  const params = merge('params', global, requestArgs, extras)
  const query = merge('query', global, requestArgs, extras)
  const headers = merge('headers', global, requestArgs, extras)
  const body =
    (requestArgs && 'body' in requestArgs ? requestArgs.body : undefined) ?? {}
  const retry = merge('retry', global, requestArgs, extras)
  const timeout = extras?.timeout ?? global?.timeout
  const merged: MergedArgs = {
    url: setParams(url, params),
    baseUrl,
    method,
    params: query,
    headers,
    body,
    retry,
    timeout,
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
