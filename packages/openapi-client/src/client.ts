import {
  BaseClient,
  ClientOptions,
  RequestArgs,
  RetrySettings,
  Verb,
  fromAxiosError,
} from '@sebspark/openapi-core'
import axios, { AxiosError } from 'axios'
import { retry } from '@sebspark/retry'

export const TypedClient = <C extends Partial<BaseClient>>(
  baseURL: string,
  globalOptions?: ClientOptions,
): C => {
  const client: BaseClient = {
    get: (url, args, opts) =>
      callServer(baseURL, url, 'get', args, globalOptions?.retry, opts?.retry),
    post: (url, args, opts) =>
      callServer(baseURL, url, 'post', args, globalOptions?.retry, opts?.retry),
    put: (url, args, opts) =>
      callServer(baseURL, url, 'put', args, globalOptions?.retry, opts?.retry),
    patch: (url, args, opts) =>
      callServer(
        baseURL,
        url,
        'patch',
        args,
        globalOptions?.retry,
        opts?.retry,
      ),
    delete: (url, args, opts) =>
      callServer(
        baseURL,
        url,
        'delete',
        args,
        globalOptions?.retry,
        opts?.retry,
      ),
  }
  return client as C
}

const callServer = async (
  baseURL: string,
  _url: string,
  method: Verb,
  args: RequestArgs | undefined,
  ...retrySettings: Array<RetrySettings | undefined>
) => {
  try {
    const url = setParams(_url, args?.params)
    const response = await retry(
      () =>
        axios.request({
          baseURL,
          url,
          method,
          headers: args?.headers,
          params: args?.query,
          data: args?.body,
        }),
      ...retrySettings,
    )
    return response.data
  } catch (error) {
    throw fromAxiosError(error as AxiosError)
  }
}

const setParams = (url: string, params: Record<string, string> = {}): string =>
  Object.entries(params).reduce(
    (url, [key, val]) =>
      url.replace(new RegExp(`/:${key}(?!\\w|\\d)`, 'g'), `/${val}`),
    url,
  )
