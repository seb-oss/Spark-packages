/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { RetrySettings } from '@sebspark/openapi-core'

const defaultSettings: Partial<RetrySettings> = {
  retryCondition: () => true,
}
const mergeSettings = (
  ...settings: Array<RetrySettings | undefined>
): RetrySettings | undefined => {
  // remove undefineds, return if no settings passed
  const s = settings.filter((s) => s) as RetrySettings[]
  if (!s.length) return undefined

  // merge settings with priority to the latest
  const merged: RetrySettings = Object.assign(defaultSettings, ...s)

  return merged
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms))

export const retry = async <T>(
  func: () => Promise<T>,
  ...settings: Array<RetrySettings | undefined>
): Promise<T> => {
  const mergedSettings = mergeSettings(...settings)

  const makeCall = async <T>(retries = 0): Promise<T> => {
    try {
      const response = await func()
      return response as T
    } catch (error) {
      if (
        mergedSettings &&
        mergedSettings.retryCondition!(error) &&
        retries < mergedSettings.maxRetries
      ) {
        retries++
        await wait(mergedSettings.interval(retries))
        return makeCall(retries)
      } else {
        throw error
      }
    }
  }
  return makeCall(0)
}

export const interval = {
  fixed: (delay: number) => (_retries: number) => delay,
  linear: (delay: number) => (retries: number) => retries * delay,
  exponential:
    (delay: number, base = 2) =>
    (retries: number) =>
      Math.pow(base, retries - 1) * delay,
}

const clientErrorCodes = [
  400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414,
  415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
] as const
type ClientErrorCode = (typeof clientErrorCodes)[number]

const serverErrorCodes = [
  500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
] as const
type ServerErrorCode = (typeof serverErrorCodes)[number]

type ErrorType = 'server' | 'client' | ServerErrorCode | ClientErrorCode

type HttpError = {
  status?: number
  statusCode?: number
  response?: {
    status?: number
    statusCode?: number
  }
}

export const retryCondition = {
  always: (_error: any) => true,
  httpErrors:
    (...codes: ErrorType[]) =>
    (error: HttpError) => {
      const captureCodes = codes
        .flatMap((code) => {
          if (typeof code === 'number') return code
          if (code === 'client') return clientErrorCodes
          if (code === 'server') return serverErrorCodes
          return
        })
        .filter((code) => !!code) as number[]
      const status =
        error.status ||
        error.statusCode ||
        error.response?.status ||
        error.response?.statusCode
      return captureCodes.includes(status!)
    },
  serverErrors: (error: any) => retryCondition.httpErrors('server')(error),
  custom: (func: (error: any) => boolean) => func,
}
