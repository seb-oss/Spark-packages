// Incubating attrs — copied as string literals per OTel JS team recommendation:
// importing from /incubating at runtime is explicitly discouraged because that
// entry-point is NOT subject to semver and may break in minor releases.
// https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-semantic-conventions#unstable-semconv
export const ATTR_HTTP_REQUEST_BODY_SIZE = 'http.request.body.size'
export const ATTR_HTTP_RESPONSE_BODY_SIZE = 'http.response.body.size'

export const DEFAULT_REQUEST_HEADERS: string[] = [
  'content-type',
  'accept',
  'x-request-id',
  'x-correlation-id',
  'traceparent',
  'tracestate',
] as const

export const DEFAULT_RESPONSE_HEADERS: string[] = [
  'content-type',
  'x-request-id',
  'x-correlation-id',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'retry-after',
] as const

export const PROTOCOLS = ['https', 'http'] as const
