import { type Span, SpanStatusCode } from '@opentelemetry/api'
import {
  ATTR_ERROR_TYPE,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_NETWORK_PEER_ADDRESS,
  ATTR_NETWORK_PEER_PORT,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_URL_FULL,
  ATTR_URL_PATH,
  ATTR_URL_QUERY,
  ATTR_URL_SCHEME,
} from '@opentelemetry/semantic-conventions'
import {
  ATTR_HTTP_REQUEST_BODY_SIZE,
  ATTR_HTTP_RESPONSE_BODY_SIZE,
} from './consts'
import type {
  NormalisedRequest,
  NormalisedResponse,
  ResolvedConfig,
} from './types'

const requestHeaderAttr = (h: string) =>
  `http.request.header.${h.toLowerCase().replace(/-/g, '_')}`
const responseHeaderAttr = (h: string) =>
  `http.response.header.${h.toLowerCase().replace(/-/g, '_')}`

export const applyRequestAttributes = (
  span: Span,
  req: NormalisedRequest,
  cfg: ResolvedConfig
): void => {
  const { method, hostname, port, path, protocol } = req
  const [urlPath, urlQuery] = path.split('?')
  /* istanbul ignore next */
  const defaultPort = protocol === 'https' ? 443 : 80
  /* istanbul ignore next */
  const portSuffix = port !== defaultPort ? `:${port}` : ''
  /* istanbul ignore next */
  const resolvedUrlPath = urlPath ?? '/'

  // Stable semconv v1.23+ attributes
  span.setAttributes({
    [ATTR_HTTP_REQUEST_METHOD]: method.toUpperCase(),
    [ATTR_SERVER_ADDRESS]: hostname,
    [ATTR_SERVER_PORT]: port,
    [ATTR_URL_SCHEME]: protocol,
    [ATTR_URL_PATH]: resolvedUrlPath,
    [ATTR_URL_FULL]: `${protocol}://${hostname}${portSuffix}${path}`,
  })

  if (urlQuery) {
    span.setAttribute(ATTR_URL_QUERY, urlQuery)
  }

  if (cfg.useDescriptiveSpanNames) {
    span.updateName(`${method.toUpperCase()} ${hostname}${resolvedUrlPath}`)
  }

  for (const header of cfg.captureRequestHeaders) {
    const value = req.getHeader(header)
    if (value !== undefined) {
      span.setAttribute(requestHeaderAttr(header), value)
    }
  }

  const contentLength = req.getHeader('content-length')
  if (contentLength !== undefined) {
    span.setAttribute(ATTR_HTTP_REQUEST_BODY_SIZE, Number(contentLength))
  }

  cfg.enrichSpan(span, req)
}

export const applyResponseAttributes = (
  span: Span,
  res: NormalisedResponse,
  cfg: ResolvedConfig
): void => {
  const { statusCode } = res

  span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, statusCode)

  // OTel spec for CLIENT spans: 5xx = SDK error; 4xx is not (it's the
  // server's fault). We still record error.type for both so they're filterable.
  if (statusCode >= 500) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: `HTTP ${statusCode}`,
    })
    span.setAttribute(ATTR_ERROR_TYPE, String(statusCode))
  } else if (statusCode >= 400) {
    span.setAttribute(ATTR_ERROR_TYPE, String(statusCode))
  }

  for (const header of cfg.captureResponseHeaders) {
    const value = res.getHeader(header)
    if (value !== undefined) {
      span.setAttribute(responseHeaderAttr(header), value)
    }
  }

  const contentLength = res.getHeader('content-length')
  if (contentLength !== undefined) {
    span.setAttribute(ATTR_HTTP_RESPONSE_BODY_SIZE, Number(contentLength))
  }

  // Resolved wire address (post-proxy) — separate from the original hostname
  // so you can see both in the span and spot mesh rewrites.
  if (res.remoteAddress) {
    span.setAttribute(ATTR_NETWORK_PEER_ADDRESS, res.remoteAddress)
  }
  if (res.remotePort) {
    span.setAttribute(ATTR_NETWORK_PEER_PORT, res.remotePort)
  }
}
