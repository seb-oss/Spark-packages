import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, test } from 'vitest'
import {
  BadGatewayError,
  BadRequestError,
  ConflictError,
  createHttpError,
  ExpectationFailedError,
  FailedDependencyError,
  ForbiddenError,
  fromAxiosError,
  GatewayTimeoutError,
  GoneError,
  HTTPVersionNotSupportedError,
  HttpError,
  IMATeapotError,
  InsufficientStorageError,
  InternalServerError,
  LengthRequiredError,
  LockedError,
  LoopDetectedError,
  MethodNotAllowedError,
  MisdirectedRequestError,
  NetworkAuthenticationRequiredError,
  NotAcceptableError,
  NotExtendedError,
  NotFoundError,
  NotImplementedError,
  PayloadTooLargeError,
  PaymentRequiredError,
  PreconditionFailedError,
  PreconditionRequiredError,
  ProxyAuthenticationRequiredError,
  RangeNotSatisfiableError,
  RequestHeaderFieldsTooLargeError,
  RequestTimeoutError,
  ServiceUnavailableError,
  TooEarlyError,
  TooManyRequestsError,
  UnauthorizedError,
  UnavailableForLegalReasonsError,
  UnprocessableEntityError,
  UnsupportedMediaTypeError,
  UpgradeRequiredError,
  URITooLongError,
  VariantAlsoNegotiatesError,
} from './errors'

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

describe('HttpError subclass prototype chain', () => {
  test('instanceof works correctly for subclass', () => {
    const err = new ForbiddenError()
    expect(err instanceof ForbiddenError).toBe(true)
  })
  test('instanceof HttpError works for subclass instance', () => {
    const err = new ForbiddenError()
    expect(err instanceof HttpError).toBe(true)
  })
  test('instanceof works for UnauthorizedError', () => {
    const err = new UnauthorizedError()
    expect(err instanceof UnauthorizedError).toBe(true)
  })
  test('instanceof works for NotFoundError', () => {
    const err = new NotFoundError()
    expect(err instanceof NotFoundError).toBe(true)
  })
})

describe('HttpError.toJSON', () => {
  test('returns message without stack by default', () => {
    const err = new HttpError(500, 'Oops')
    expect(err.toJSON()).toEqual({ message: 'Oops' })
  })
  test('includes stack when showStack is true', () => {
    const err = new HttpError(500, 'Oops')
    const json = err.toJSON(true)
    expect(json.message).toBe('Oops')
    expect(json.stack).toBeDefined()
  })
  test('HttpError with cause clears own stack', () => {
    const cause = new Error('root cause')
    const err = new HttpError(500, 'Oops', cause)
    expect(err.cause).toBe(cause)
    expect(err.stack).toBeUndefined()
  })
})

describe('createHttpError', () => {
  const cases: [number, string, unknown][] = [
    [400, 'Bad Request', BadRequestError],
    [401, 'Unauthorized', UnauthorizedError],
    [402, 'Payment Required', PaymentRequiredError],
    [403, 'Forbidden', ForbiddenError],
    [404, 'Not Found', NotFoundError],
    [405, 'Method Not Allowed', MethodNotAllowedError],
    [406, 'Not Acceptable', NotAcceptableError],
    [407, 'Proxy Authentication Required', ProxyAuthenticationRequiredError],
    [408, 'Request Timeout', RequestTimeoutError],
    [409, 'Conflict', ConflictError],
    [410, 'Gone', GoneError],
    [411, 'Length Required', LengthRequiredError],
    [412, 'Precondition Failed', PreconditionFailedError],
    [413, 'Payload Too Large', PayloadTooLargeError],
    [414, 'URI Too Long', URITooLongError],
    [415, 'Unsupported Media Type', UnsupportedMediaTypeError],
    [416, 'Range Not Satisfiable', RangeNotSatisfiableError],
    [417, 'Expectation Failed', ExpectationFailedError],
    [418, "I'm a teapot", IMATeapotError],
    [421, 'Misdirected Request', MisdirectedRequestError],
    [422, 'Unprocessable Entity', UnprocessableEntityError],
    [423, 'Locked', LockedError],
    [424, 'Failed Dependency', FailedDependencyError],
    [425, 'Too Early', TooEarlyError],
    [426, 'Upgrade Required', UpgradeRequiredError],
    [428, 'Precondition Required', PreconditionRequiredError],
    [429, 'Too Many Requests', TooManyRequestsError],
    [431, 'Request Header Fields Too Large', RequestHeaderFieldsTooLargeError],
    [451, 'Unavailable For Legal Reasons', UnavailableForLegalReasonsError],
    [500, 'Internal Server Error', InternalServerError],
    [501, 'Not Implemented', NotImplementedError],
    [502, 'Bad Gateway', BadGatewayError],
    [503, 'Service Unavailable', ServiceUnavailableError],
    [504, 'Gateway Timeout', GatewayTimeoutError],
    [505, 'HTTP Version Not Supported', HTTPVersionNotSupportedError],
    [506, 'Variant Also Negotiates', VariantAlsoNegotiatesError],
    [507, 'Insufficient Storage', InsufficientStorageError],
    [508, 'Loop Detected', LoopDetectedError],
    [510, 'Not Extended', NotExtendedError],
    [
      511,
      'Network Authentication Required',
      NetworkAuthenticationRequiredError,
    ],
  ]

  for (const [code, defaultMessage, ErrorClass] of cases) {
    test(`createHttpError(${code}) returns ${(ErrorClass as { name: string }).name} with default message`, () => {
      const err = createHttpError(code as Parameters<typeof createHttpError>[0])
      expect(err).toBeInstanceOf(ErrorClass as typeof HttpError)
      expect(err.statusCode).toBe(code)
      expect(err.message).toBe(defaultMessage)
    })
  }

  test('createHttpError uses provided message', () => {
    const err = createHttpError(404, 'Custom message')
    expect(err.message).toBe('Custom message')
  })

  test('createHttpError attaches cause', () => {
    const cause = new Error('root')
    const err = createHttpError(500, undefined, cause)
    expect(err.cause).toBe(cause)
  })
})

describe('fromAxiosError: message fallback', () => {
  test('falls back to axiosError.message when no statusText', () => {
    const headers = new AxiosHeaders()
    const response = {
      statusText: '',
      headers,
      config: { headers },
      status: 503,
      data: {},
    }
    const incomingError = new AxiosError(
      'Service down',
      '',
      undefined,
      undefined,
      response
    )
    const err = fromAxiosError(incomingError)
    expect(err.message).toBe('Service down')
    expect(err.statusCode).toBe(503)
  })

  test('falls back to Internal Server Error when no statusText or message', () => {
    const headers = new AxiosHeaders()
    const response = {
      statusText: '',
      headers,
      config: { headers },
      status: 502,
      data: {},
    }
    const incomingError = new AxiosError('', '', undefined, undefined, response)
    const err = fromAxiosError(incomingError)
    expect(err.message).toBe('Internal Server Error')
    expect(err.statusCode).toBe(502)
  })
})
