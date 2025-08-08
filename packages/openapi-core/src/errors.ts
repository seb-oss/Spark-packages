import { inspect } from 'node:util' // use 'util' for RN Metro + polyfill support
import type { AxiosError } from 'axios'

export type ClientErrorCode =
  | 400
  | 401
  | 402
  | 403
  | 404
  | 405
  | 406
  | 407
  | 408
  | 409
  | 410
  | 411
  | 412
  | 413
  | 414
  | 415
  | 416
  | 417
  | 418
  | 421
  | 422
  | 423
  | 424
  | 425
  | 426
  | 428
  | 429
  | 431
  | 451
export type ServerErrorCode =
  | 500
  | 501
  | 502
  | 503
  | 504
  | 505
  | 506
  | 507
  | 508
  | 510
  | 511
export type ErrorCode = ClientErrorCode | ServerErrorCode

type SerializedError = {
  message: string
  stack?: string
}

// Base HttpError class
export class HttpError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string, cause?: Error) {
    super(message)
    if (cause) {
      this.stack = undefined
      this.cause = cause
    }
    this.statusCode = statusCode
    Object.setPrototypeOf(this, HttpError.prototype)
  }

  toJSON(showStack = false) {
    const serialized: SerializedError = {
      message: this.message,
    }
    if (showStack) {
      serialized.stack = inspect(this)
    }
    return serialized
  }
}

// Specific error classes extending HttpError
export class BadRequestError extends HttpError {
  constructor(message = 'Bad Request', cause?: Error) {
    super(400, message, cause)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized', cause?: Error) {
    super(401, message, cause)
  }
}

export class PaymentRequiredError extends HttpError {
  constructor(message = 'Payment Required', cause?: Error) {
    super(402, message, cause)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden', cause?: Error) {
    super(403, message, cause)
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found', cause?: Error) {
    super(404, message, cause)
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(message = 'Method Not Allowed', cause?: Error) {
    super(405, message, cause)
  }
}

export class NotAcceptableError extends HttpError {
  constructor(message = 'Not Acceptable', cause?: Error) {
    super(406, message, cause)
  }
}

export class ProxyAuthenticationRequiredError extends HttpError {
  constructor(message = 'Proxy Authentication Required', cause?: Error) {
    super(407, message, cause)
  }
}

export class RequestTimeoutError extends HttpError {
  constructor(message = 'Request Timeout', cause?: Error) {
    super(408, message, cause)
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', cause?: Error) {
    super(409, message, cause)
  }
}

export class GoneError extends HttpError {
  constructor(message = 'Gone', cause?: Error) {
    super(410, message, cause)
  }
}

export class LengthRequiredError extends HttpError {
  constructor(message = 'Length Required', cause?: Error) {
    super(411, message, cause)
  }
}

export class PreconditionFailedError extends HttpError {
  constructor(message = 'Precondition Failed', cause?: Error) {
    super(412, message, cause)
  }
}

export class PayloadTooLargeError extends HttpError {
  constructor(message = 'Payload Too Large', cause?: Error) {
    super(413, message, cause)
  }
}

export class URITooLongError extends HttpError {
  constructor(message = 'URI Too Long', cause?: Error) {
    super(414, message, cause)
  }
}

export class UnsupportedMediaTypeError extends HttpError {
  constructor(message = 'Unsupported Media Type', cause?: Error) {
    super(415, message, cause)
  }
}

export class RangeNotSatisfiableError extends HttpError {
  constructor(message = 'Range Not Satisfiable', cause?: Error) {
    super(416, message, cause)
  }
}

export class ExpectationFailedError extends HttpError {
  constructor(message = 'Expectation Failed', cause?: Error) {
    super(417, message, cause)
  }
}

export class IMATeapotError extends HttpError {
  constructor(message = "I'm a teapot", cause?: Error) {
    super(418, message, cause)
  }
}

export class MisdirectedRequestError extends HttpError {
  constructor(message = 'Misdirected Request', cause?: Error) {
    super(421, message, cause)
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message = 'Unprocessable Entity', cause?: Error) {
    super(422, message, cause)
  }
}

export class LockedError extends HttpError {
  constructor(message = 'Locked', cause?: Error) {
    super(423, message, cause)
  }
}

export class FailedDependencyError extends HttpError {
  constructor(message = 'Failed Dependency', cause?: Error) {
    super(424, message, cause)
  }
}

export class TooEarlyError extends HttpError {
  constructor(message = 'Too Early', cause?: Error) {
    super(425, message, cause)
  }
}

export class UpgradeRequiredError extends HttpError {
  constructor(message = 'Upgrade Required', cause?: Error) {
    super(426, message, cause)
  }
}

export class PreconditionRequiredError extends HttpError {
  constructor(message = 'Precondition Required', cause?: Error) {
    super(428, message, cause)
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'Too Many Requests', cause?: Error) {
    super(429, message, cause)
  }
}

export class RequestHeaderFieldsTooLargeError extends HttpError {
  constructor(message = 'Request Header Fields Too Large', cause?: Error) {
    super(431, message, cause)
  }
}

export class UnavailableForLegalReasonsError extends HttpError {
  constructor(message = 'Unavailable For Legal Reasons', cause?: Error) {
    super(451, message, cause)
  }
}

// 500 Range Error Classes
export class InternalServerError extends HttpError {
  constructor(message = 'Internal Server Error', cause?: Error) {
    super(500, message, cause)
  }
}

export class NotImplementedError extends HttpError {
  constructor(message = 'Not Implemented', cause?: Error) {
    super(501, message, cause)
  }
}

export class BadGatewayError extends HttpError {
  constructor(message = 'Bad Gateway', cause?: Error) {
    super(502, message, cause)
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = 'Service Unavailable', cause?: Error) {
    super(503, message, cause)
  }
}

export class GatewayTimeoutError extends HttpError {
  constructor(message = 'Gateway Timeout', cause?: Error) {
    super(504, message, cause)
  }
}

export class HTTPVersionNotSupportedError extends HttpError {
  constructor(message = 'HTTP Version Not Supported', cause?: Error) {
    super(505, message, cause)
  }
}

export class VariantAlsoNegotiatesError extends HttpError {
  constructor(message = 'Variant Also Negotiates', cause?: Error) {
    super(506, message, cause)
  }
}

export class InsufficientStorageError extends HttpError {
  constructor(message = 'Insufficient Storage', cause?: Error) {
    super(507, message, cause)
  }
}

export class LoopDetectedError extends HttpError {
  constructor(message = 'Loop Detected', cause?: Error) {
    super(508, message, cause)
  }
}

export class NotExtendedError extends HttpError {
  constructor(message = 'Not Extended', cause?: Error) {
    super(510, message, cause)
  }
}

export class NetworkAuthenticationRequiredError extends HttpError {
  constructor(message = 'Network Authentication Required', cause?: Error) {
    super(511, message, cause)
  }
}

// Function to create an error based on status code
export const createHttpError = (
  statusCode: ErrorCode,
  message?: string,
  cause?: Error
): HttpError => {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, cause)
    case 401:
      return new UnauthorizedError(message, cause)
    case 402:
      return new PaymentRequiredError(message, cause)
    case 403:
      return new ForbiddenError(message, cause)
    case 404:
      return new NotFoundError(message, cause)
    case 405:
      return new MethodNotAllowedError(message, cause)
    case 406:
      return new NotAcceptableError(message, cause)
    case 407:
      return new ProxyAuthenticationRequiredError(message, cause)
    case 408:
      return new RequestTimeoutError(message, cause)
    case 409:
      return new ConflictError(message, cause)
    case 410:
      return new GoneError(message, cause)
    case 411:
      return new LengthRequiredError(message, cause)
    case 412:
      return new PreconditionFailedError(message, cause)
    case 413:
      return new PayloadTooLargeError(message, cause)
    case 414:
      return new URITooLongError(message, cause)
    case 415:
      return new UnsupportedMediaTypeError(message, cause)
    case 416:
      return new RangeNotSatisfiableError(message, cause)
    case 417:
      return new ExpectationFailedError(message, cause)
    case 418:
      return new IMATeapotError(message, cause)
    case 421:
      return new MisdirectedRequestError(message, cause)
    case 422:
      return new UnprocessableEntityError(message, cause)
    case 423:
      return new LockedError(message, cause)
    case 424:
      return new FailedDependencyError(message, cause)
    case 425:
      return new TooEarlyError(message, cause)
    case 426:
      return new UpgradeRequiredError(message, cause)
    case 428:
      return new PreconditionRequiredError(message, cause)
    case 429:
      return new TooManyRequestsError(message, cause)
    case 431:
      return new RequestHeaderFieldsTooLargeError(message, cause)
    case 451:
      return new UnavailableForLegalReasonsError(message, cause)
    case 500:
      return new InternalServerError(message, cause)
    case 501:
      return new NotImplementedError(message, cause)
    case 502:
      return new BadGatewayError(message, cause)
    case 503:
      return new ServiceUnavailableError(message, cause)
    case 504:
      return new GatewayTimeoutError(message, cause)
    case 505:
      return new HTTPVersionNotSupportedError(message, cause)
    case 506:
      return new VariantAlsoNegotiatesError(message, cause)
    case 507:
      return new InsufficientStorageError(message, cause)
    case 508:
      return new LoopDetectedError(message, cause)
    case 510:
      return new NotExtendedError(message, cause)
    case 511:
      return new NetworkAuthenticationRequiredError(message, cause)
    default:
      return new HttpError(statusCode, message ?? 'Error', cause)
  }
}

export const fromAxiosError = (axiosError: AxiosError): HttpError => {
  // Default to 500 Internal Server Error if the status code is not available
  const statusCode = (axiosError.response?.status || 500) as ErrorCode
  const message = axiosError.response?.statusText || 'Internal Server Error'

  // The internal error can contain more specific details about the Axios error
  const cause = new Error(axiosError.message)
  cause.name = axiosError.name
  cause.stack = axiosError.stack
  // If the error response has a data property pass it along
  cause.cause = axiosError?.response?.data

  return createHttpError(statusCode, message, cause)
}
