import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { RetrySettings, interval, retry, retryCondition } from './retry'

describe('retry', () => {
  it('it calls through', async () => {
    const func = vi.fn().mockResolvedValue(true)
    await retry(func)
    expect(func).toHaveBeenCalledOnce()
  })

  it('returns result', async () => {
    const func = vi.fn().mockResolvedValue(true)
    const result = await retry(func)
    expect(result).toBe(true)
  })

  it('makes a retry after the specified time', async () => {
    const func = vi.fn().mockResolvedValue(true)
    func.mockRejectedValueOnce(new Error())

    const settings: RetrySettings = {
      interval: () => 10,
      maxRetries: 1,
      retryCondition: () => true,
    }

    const result = await retry(func, settings)
    expect(result).toBe(true)
  })
})

describe('interval', () => {
  describe('interval.fixed', () => {
    it('returns the same value all the time', () => {
      const func = interval.fixed(1000)

      expect(func(1)).toEqual(1000)
      expect(func(2)).toEqual(1000)
      expect(func(3)).toEqual(1000)
    })
  })

  describe('interval.linear', () => {
    it('returns a multiplier of the value', () => {
      const func = interval.linear(1000)

      expect(func(1)).toEqual(1000)
      expect(func(2)).toEqual(2000)
      expect(func(3)).toEqual(3000)
    })
  })

  describe('interval.exponential', () => {
    it('returns an exponentially increasing value', () => {
      const func = interval.exponential(1000, 2)

      expect(func(1)).toEqual(1000)
      expect(func(2)).toEqual(2000)
      expect(func(3)).toEqual(4000)
      expect(func(4)).toEqual(8000)
    })
  })
})

describe('retryCondition', () => {
  describe('all', () => {
    it('always returns true', () => {
      expect(retryCondition.always(true)).toBe(true)
      expect(retryCondition.always(false)).toBe(true)
      expect(retryCondition.always(new Error())).toBe(true)
    })
  })

  describe('custom', () => {
    it('returns the result of the evaluator', () => {
      expect(retryCondition.custom(() => true)(true)).toBe(true)
      expect(retryCondition.custom(() => true)(false)).toBe(true)
      expect(retryCondition.custom(() => true)(new Error())).toBe(true)
      expect(retryCondition.custom(() => false)(true)).toBe(false)
      expect(retryCondition.custom(() => false)(false)).toBe(false)
      expect(retryCondition.custom(() => false)(new Error())).toBe(false)
    })
  })

  const createAxiosError = (message: string, status: number): AxiosError => {
    // Create a mock response with the given status
    const mockResponse: Partial<AxiosResponse> = {
      status: status,
      statusText: status === 500 ? 'Internal Server Error' : '',
    }

    // Create a standard error object
    const standardError = new Error(message)

    // Use AxiosError.from to transform the standard error into an AxiosError
    return AxiosError.from(
      standardError,
      status.toString(),
      {} as InternalAxiosRequestConfig, // Mock Axios config
      {}, // Mock request object
      mockResponse as AxiosResponse // Cast the partial response to AxiosResponse
    )
  }

  describe('serverErrors', () => {
    it('returns true if error is in the 500 range', () => {
      expect(
        retryCondition.serverErrors(
          createAxiosError('Internal Server Error', 500)
        )
      ).toBe(true)
    })
  })
})
