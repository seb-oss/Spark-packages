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
  internalError?: {
    message: string
    stack?: string
  }
}

// Base HttpError class
export class HttpError extends Error {
  statusCode: number
  internalError?: Error

  constructor(statusCode: number, message: string, internalError?: Error) {
    super(message)
    this.statusCode = statusCode
    this.internalError = internalError
    Object.setPrototypeOf(this, HttpError.prototype)
  }

  toJSON(includeInternalError: boolean = false) {
    const serialized: SerializedError = {
      message: this.message,
    }
    if (includeInternalError && this.internalError) {
      serialized.internalError = {
        message: this.internalError.message,
        stack: this.internalError?.stack,
      }
    }
    return serialized
  }
}

// Specific error classes extending HttpError
export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad Request', internalError?: Error) {
    super(400, message, internalError)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized', internalError?: Error) {
    super(401, message, internalError)
  }
}

export class PaymentRequiredError extends HttpError {
  constructor(message: string = 'Payment Required', internalError?: Error) {
    super(402, message, internalError)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden', internalError?: Error) {
    super(403, message, internalError)
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Not Found', internalError?: Error) {
    super(404, message, internalError)
  }
}

export class MethodNotAllowedError extends HttpError {
  constructor(message: string = 'Method Not Allowed', internalError?: Error) {
    super(405, message, internalError)
  }
}

export class NotAcceptableError extends HttpError {
  constructor(message: string = 'Not Acceptable', internalError?: Error) {
    super(406, message, internalError)
  }
}

export class ProxyAuthenticationRequiredError extends HttpError {
  constructor(
    message: string = 'Proxy Authentication Required',
    internalError?: Error,
  ) {
    super(407, message, internalError)
  }
}

export class RequestTimeoutError extends HttpError {
  constructor(message: string = 'Request Timeout', internalError?: Error) {
    super(408, message, internalError)
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Conflict', internalError?: Error) {
    super(409, message, internalError)
  }
}

export class GoneError extends HttpError {
  constructor(message: string = 'Gone', internalError?: Error) {
    super(410, message, internalError)
  }
}

export class LengthRequiredError extends HttpError {
  constructor(message: string = 'Length Required', internalError?: Error) {
    super(411, message, internalError)
  }
}

export class PreconditionFailedError extends HttpError {
  constructor(message: string = 'Precondition Failed', internalError?: Error) {
    super(412, message, internalError)
  }
}

export class PayloadTooLargeError extends HttpError {
  constructor(message: string = 'Payload Too Large', internalError?: Error) {
    super(413, message, internalError)
  }
}

export class URITooLongError extends HttpError {
  constructor(message: string = 'URI Too Long', internalError?: Error) {
    super(414, message, internalError)
  }
}

export class UnsupportedMediaTypeError extends HttpError {
  constructor(
    message: string = 'Unsupported Media Type',
    internalError?: Error,
  ) {
    super(415, message, internalError)
  }
}

export class RangeNotSatisfiableError extends HttpError {
  constructor(
    message: string = 'Range Not Satisfiable',
    internalError?: Error,
  ) {
    super(416, message, internalError)
  }
}

export class ExpectationFailedError extends HttpError {
  constructor(message: string = 'Expectation Failed', internalError?: Error) {
    super(417, message, internalError)
  }
}

export class IMATeapotError extends HttpError {
  constructor(message: string = "I'm a teapot", internalError?: Error) {
    super(418, message, internalError)
  }
}

export class MisdirectedRequestError extends HttpError {
  constructor(message: string = 'Misdirected Request', internalError?: Error) {
    super(421, message, internalError)
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message: string = 'Unprocessable Entity', internalError?: Error) {
    super(422, message, internalError)
  }
}

export class LockedError extends HttpError {
  constructor(message: string = 'Locked', internalError?: Error) {
    super(423, message, internalError)
  }
}

export class FailedDependencyError extends HttpError {
  constructor(message: string = 'Failed Dependency', internalError?: Error) {
    super(424, message, internalError)
  }
}

export class TooEarlyError extends HttpError {
  constructor(message: string = 'Too Early', internalError?: Error) {
    super(425, message, internalError)
  }
}

export class UpgradeRequiredError extends HttpError {
  constructor(message: string = 'Upgrade Required', internalError?: Error) {
    super(426, message, internalError)
  }
}

export class PreconditionRequiredError extends HttpError {
  constructor(
    message: string = 'Precondition Required',
    internalError?: Error,
  ) {
    super(428, message, internalError)
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string = 'Too Many Requests', internalError?: Error) {
    super(429, message, internalError)
  }
}

export class RequestHeaderFieldsTooLargeError extends HttpError {
  constructor(
    message: string = 'Request Header Fields Too Large',
    internalError?: Error,
  ) {
    super(431, message, internalError)
  }
}

export class UnavailableForLegalReasonsError extends HttpError {
  constructor(
    message: string = 'Unavailable For Legal Reasons',
    internalError?: Error,
  ) {
    super(451, message, internalError)
  }
}

// 500 Range Error Classes
export class InternalServerError extends HttpError {
  constructor(
    message: string = 'Internal Server Error',
    internalError?: Error,
  ) {
    super(500, message, internalError)
  }
}

export class NotImplementedError extends HttpError {
  constructor(message: string = 'Not Implemented', internalError?: Error) {
    super(501, message, internalError)
  }
}

export class BadGatewayError extends HttpError {
  constructor(message: string = 'Bad Gateway', internalError?: Error) {
    super(502, message, internalError)
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string = 'Service Unavailable', internalError?: Error) {
    super(503, message, internalError)
  }
}

export class GatewayTimeoutError extends HttpError {
  constructor(message: string = 'Gateway Timeout', internalError?: Error) {
    super(504, message, internalError)
  }
}

export class HTTPVersionNotSupportedError extends HttpError {
  constructor(
    message: string = 'HTTP Version Not Supported',
    internalError?: Error,
  ) {
    super(505, message, internalError)
  }
}

export class VariantAlsoNegotiatesError extends HttpError {
  constructor(
    message: string = 'Variant Also Negotiates',
    internalError?: Error,
  ) {
    super(506, message, internalError)
  }
}

export class InsufficientStorageError extends HttpError {
  constructor(message: string = 'Insufficient Storage', internalError?: Error) {
    super(507, message, internalError)
  }
}

export class LoopDetectedError extends HttpError {
  constructor(message: string = 'Loop Detected', internalError?: Error) {
    super(508, message, internalError)
  }
}

export class NotExtendedError extends HttpError {
  constructor(message: string = 'Not Extended', internalError?: Error) {
    super(510, message, internalError)
  }
}

export class NetworkAuthenticationRequiredError extends HttpError {
  constructor(
    message: string = 'Network Authentication Required',
    internalError?: Error,
  ) {
    super(511, message, internalError)
  }
}

// Function to create an error based on status code
export const createHttpError = (
  statusCode: ErrorCode,
  message?: string,
  internalError?: Error,
): HttpError => {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, internalError)
    case 401:
      return new UnauthorizedError(message, internalError)
    case 402:
      return new PaymentRequiredError(message, internalError)
    case 403:
      return new ForbiddenError(message, internalError)
    case 404:
      return new NotFoundError(message, internalError)
    case 405:
      return new MethodNotAllowedError(message, internalError)
    case 406:
      return new NotAcceptableError(message, internalError)
    case 407:
      return new ProxyAuthenticationRequiredError(message, internalError)
    case 408:
      return new RequestTimeoutError(message, internalError)
    case 409:
      return new ConflictError(message, internalError)
    case 410:
      return new GoneError(message, internalError)
    case 411:
      return new LengthRequiredError(message, internalError)
    case 412:
      return new PreconditionFailedError(message, internalError)
    case 413:
      return new PayloadTooLargeError(message, internalError)
    case 414:
      return new URITooLongError(message, internalError)
    case 415:
      return new UnsupportedMediaTypeError(message, internalError)
    case 416:
      return new RangeNotSatisfiableError(message, internalError)
    case 417:
      return new ExpectationFailedError(message, internalError)
    case 418:
      return new IMATeapotError(message, internalError)
    case 421:
      return new MisdirectedRequestError(message, internalError)
    case 422:
      return new UnprocessableEntityError(message, internalError)
    case 423:
      return new LockedError(message, internalError)
    case 424:
      return new FailedDependencyError(message, internalError)
    case 425:
      return new TooEarlyError(message, internalError)
    case 426:
      return new UpgradeRequiredError(message, internalError)
    case 428:
      return new PreconditionRequiredError(message, internalError)
    case 429:
      return new TooManyRequestsError(message, internalError)
    case 431:
      return new RequestHeaderFieldsTooLargeError(message, internalError)
    case 451:
      return new UnavailableForLegalReasonsError(message, internalError)
    case 500:
      return new InternalServerError(message, internalError)
    case 501:
      return new NotImplementedError(message, internalError)
    case 502:
      return new BadGatewayError(message, internalError)
    case 503:
      return new ServiceUnavailableError(message, internalError)
    case 504:
      return new GatewayTimeoutError(message, internalError)
    case 505:
      return new HTTPVersionNotSupportedError(message, internalError)
    case 506:
      return new VariantAlsoNegotiatesError(message, internalError)
    case 507:
      return new InsufficientStorageError(message, internalError)
    case 508:
      return new LoopDetectedError(message, internalError)
    case 510:
      return new NotExtendedError(message, internalError)
    case 511:
      return new NetworkAuthenticationRequiredError(message, internalError)
    default:
      return new HttpError(statusCode, message ?? 'Error')
  }
}

export const fromAxiosError = (axiosError: AxiosError): HttpError => {
  // Default to 500 Internal Server Error if the status code is not available
  const statusCode = (axiosError.response?.status || 500) as ErrorCode
  const message = axiosError.response?.statusText || 'Internal Server Error'

  // The internal error can contain more specific details about the Axios error
  const internalError = new Error(axiosError.message)
  internalError.name = axiosError.name
  internalError.stack = axiosError.stack

  return createHttpError(statusCode, message, internalError)
}
