/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { RetrySettings } from '@sebspark/openapi-core'
import type { AxiosError } from 'axios'

const defaultSettings: Partial<RetrySettings> = {
  retryCondition: () => true,
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms))

export const retry = async <T>(
  func: () => Promise<T>,
  ...settings: Array<RetrySettings | undefined>
): Promise<T> => {
  // remove undefineds, return if no settings passed
  const s = settings.filter((s) => s) as RetrySettings[]
  if (!s.length) return func()

  // merge settings with priority to the latest
  const merged: RetrySettings = Object.assign(defaultSettings, ...s)

  const makeCall = async <T>(retries = 0): Promise<T> => {
    try {
      const response = await func()
      return response as T
    } catch (error) {
      if (merged.retryCondition!(error) && retries < merged.maxRetries) {
        retries++
        await wait(merged.interval(retries))
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
export const retryCondition = {
  always: (_error: any) => true,
  serverErrors: (error: any) => {
    const status = error.status || error.statusCode || error.response?.status
    if (status! >= 500) return true
    return false
  },
  custom: (func: (error: any) => boolean) => func,
}
