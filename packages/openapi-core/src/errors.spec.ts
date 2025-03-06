import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, test } from 'vitest'
import { fromAxiosError } from './errors'

const commonHeaders = new AxiosHeaders()
const commonResponseProperties = {
  statusText: '',
  headers: commonHeaders,
  config: { headers: commonHeaders },
}

describe('fromAxiosError: ', async () => {
  test('returns default HttpError (500) when response status is not available', () => {
    const request = { path: '/enrollment/get-child' }
    const response = {
      ...commonResponseProperties,
      status: 0,
      data: {},
    }
    const incomingError = new AxiosError('', '', undefined, request, response)
    const returnedError = fromAxiosError(incomingError)

    expect(returnedError.message).toBe('Internal Server Error') // fallback since response does not contain statusText property
    expect(returnedError.statusCode).toBe(500) // fallback since response does not contain legit status
    expect((returnedError.cause as AxiosError).name).toBe('AxiosError')
    expect((returnedError.cause as AxiosError).stack).toBeDefined()
    expect((returnedError.cause as AxiosError).cause).toStrictEqual({})
  })

  test('returns appropriate HttpError (404) based on response status and data', () => {
    const request = { path: '/enrollment/get-child' }
    const response = {
      ...commonResponseProperties,
      status: 404,
      data: {
        code: 'CHILD_NOT_FOUND',
        description: 'There is no child with that pnr',
        status: 404,
        statusText: 'CHILD_NOT_FOUND',
      },
    }
    const incomingError = new AxiosError('', '', undefined, request, response)
    const returnedError = fromAxiosError(incomingError)

    expect(returnedError.message).toBe('Internal Server Error') // fallback since response does not contain statusText property
    expect(returnedError.statusCode).toBe(404)
    expect((returnedError.cause as AxiosError).cause).toStrictEqual(
      response.data
    )
  })

  test('returns appropriate HttpError (401) based on response status and data', () => {
    const request = { path: '/accounts/balance' }
    const response = {
      ...commonResponseProperties,
      statusText: 'Unauthorized',
      status: 401,
      data: {
        code: 'AUTH_ERROR',
        description: 'Token expired',
        status: 401,
      },
    }
    const incomingError = new AxiosError(
      'Unauthorized',
      'AUTH_ERROR',
      undefined,
      request,
      response
    )
    const returnedError = fromAxiosError(incomingError)

    expect(returnedError.message).toBe('Unauthorized')
    expect(returnedError.statusCode).toBe(401)
    expect((returnedError.cause as AxiosError).cause).toStrictEqual(
      response.data
    )
  })
})
