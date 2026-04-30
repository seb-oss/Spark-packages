import {
  type ClientRequest,
  IncomingMessage,
  OutgoingHttpHeader,
  RequestOptions,
  ServerResponse,
} from 'node:http'
import { OutgoingHttpHeaders } from 'node:http2'
import { Socket } from 'node:net'
import { type Span, SpanStatusCode } from '@opentelemetry/api'
import type {
  UndiciRequest,
  UndiciResponse,
} from '@opentelemetry/instrumentation-undici'
import {
  ATTR_ERROR_TYPE,
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
  ATTR_NETWORK_PEER_ADDRESS,
  ATTR_NETWORK_PEER_PORT,
  ATTR_NETWORK_PROTOCOL_VERSION,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_URL_FULL,
  ATTR_URL_PATH,
  ATTR_URL_QUERY,
  ATTR_URL_SCHEME,
} from '@opentelemetry/semantic-conventions'
import { describe, expect, it, vi } from 'vitest'
import {
  ATTR_HTTP_REQUEST_BODY_SIZE,
  ATTR_HTTP_RESPONSE_BODY_SIZE,
} from './consts'
import { buildHttpConfig, buildUndiciConfig } from './index'

const makeSpan = () => {
  const attrs: Record<string, unknown> = {}
  let spanName = ''
  const setStatus = vi.fn()
  const span: Partial<Span> = {
    setAttribute: vi.fn((k: string, v: unknown): Span => {
      attrs[k] = v
      return span as Partial<Span> as Span
    }),
    setAttributes: vi.fn((a: Record<string, unknown>): Span => {
      Object.assign(attrs, a)
      return span as Partial<Span> as Span
    }),
    setStatus: vi.fn((...args: Parameters<Span['setStatus']>): Span => {
      setStatus(...args)
      return span as Partial<Span> as Span
    }),
    updateName: vi.fn((n: string): Span => {
      spanName = n
      return span as Partial<Span> as Span
    }),
  }
  return {
    span: span as Span,
    attrs,
    setStatus,
    get name() {
      return spanName
    },
  }
}

const makeIncomingMessage = (
  overrides: Partial<IncomingMessage> = {}
): IncomingMessage => {
  const msg: Partial<IncomingMessage> = {
    socket: {} as Partial<Socket> as Socket,
    ...overrides,
  }
  return msg as IncomingMessage
}

const makeClientRequest = (
  overrides: Partial<ClientRequest> = {}
): ClientRequest => {
  const headers: OutgoingHttpHeaders = {}
  const req: Partial<ClientRequest | RequestOptions> = {
    host: 'example.com',
    path: '/',
    method: 'GET',
    ...overrides,

    headers,
    getHeader: (name) => headers[name],
    getHeaderNames: () => Object.keys(headers),
    getHeaders: () => headers,
    setHeader: (name, value) => {
      headers[name] = value as OutgoingHttpHeader
      return req as ClientRequest
    },
    setHeaders: (newHeaders) => {
      for (const [key, value] of newHeaders) {
        headers[key] = value as OutgoingHttpHeader
      }
      return req as ClientRequest
    },
  }
  return req as ClientRequest
}

const makeUndiciRequest = (
  overrides: Partial<UndiciRequest> = {}
): UndiciRequest => {
  const req: Partial<UndiciRequest> = {
    origin: 'http://localhost',
    path: '/',
    method: 'GET',
    headers: [],
    contentLength: null,
    contentType: null,
    body: null,
    ...overrides,
  }
  return req as UndiciRequest
}

const makeUndiciResponse = (
  overrides: Partial<UndiciResponse> = {}
): UndiciResponse => {
  const res: Partial<UndiciResponse> = {
    statusCode: 200,
    statusText: 'OK',
    headers: [],
    ...overrides,
  }
  return res as UndiciResponse
}

describe('buildHttpConfig', () => {
  describe('startOutgoingSpanHook', () => {
    it('sets core request attributes', () => {
      const { startOutgoingSpanHook } = buildHttpConfig({})
      const result = startOutgoingSpanHook!({
        host: 'example.com',
        port: 8080,
        path: '/api/users?page=1',
        method: 'GET',
        headers: { 'content-type': 'application/json' },
      })
      expect(result[ATTR_HTTP_REQUEST_METHOD]).toBe('GET')
      expect(result[ATTR_SERVER_ADDRESS]).toBe('example.com')
      expect(result[ATTR_SERVER_PORT]).toBe(8080)
      expect(result[ATTR_URL_SCHEME]).toBe('http')
      expect(result[ATTR_URL_PATH]).toBe('/api/users')
      expect(result[ATTR_URL_FULL]).toBe(
        'http://example.com:8080/api/users?page=1'
      )
    })

    it('omits port suffix for default http port', () => {
      const { startOutgoingSpanHook } = buildHttpConfig({})
      const result = startOutgoingSpanHook!({
        host: 'example.com',
        port: 80,
        path: '/',
        method: 'GET',
        headers: {},
      })
      expect(result[ATTR_URL_FULL]).toBe('http://example.com/')
    })

    it('uses https scheme for port 443', () => {
      const { startOutgoingSpanHook } = buildHttpConfig({})
      const result = startOutgoingSpanHook!({
        host: 'example.com',
        port: 443,
        path: '/secure',
        method: 'POST',
        headers: {},
      })
      expect(result[ATTR_URL_SCHEME]).toBe('https')
      expect(result[ATTR_URL_FULL]).toBe('https://example.com/secure')
    })

    it('skips falsy header values and joins array header values', () => {
      const { startOutgoingSpanHook } = buildHttpConfig({})
      const result = startOutgoingSpanHook!({
        host: 'example.com',
        port: 80,
        path: '/',
        method: 'GET',
        headers: { 'x-null': null, 'x-multi': ['a', 'b'] },
      })
      expect(result['http.request.header.x_null']).toBeUndefined()
      expect(result['http.request.header.x_multi']).toBe('a,b')
    })
  })
  describe('ignoreOutgoingRequestHook', () => {
    it('returns false when no paths configured', () => {
      const { ignoreOutgoingRequestHook } = buildHttpConfig({})
      expect(ignoreOutgoingRequestHook!({ path: '/health' })).toBe(false)
    })

    it('ignores requests matching a configured path prefix', () => {
      const { ignoreOutgoingRequestHook } = buildHttpConfig({
        ignoreOutgoingPaths: ['/health'],
      })
      expect(ignoreOutgoingRequestHook!({ path: '/health' })).toBe(true)
      expect(ignoreOutgoingRequestHook!({ path: '/health/live' })).toBe(true)
    })

    it('does not ignore requests that do not match', () => {
      const { ignoreOutgoingRequestHook } = buildHttpConfig({
        ignoreOutgoingPaths: ['/health'],
      })
      expect(ignoreOutgoingRequestHook!({ path: '/api/users' })).toBe(false)
    })

    it('is case-insensitive', () => {
      const { ignoreOutgoingRequestHook } = buildHttpConfig({
        ignoreOutgoingPaths: ['/Health'],
      })
      expect(ignoreOutgoingRequestHook!({ path: '/health' })).toBe(true)
    })

    it('treats missing path as empty string', () => {
      const { ignoreOutgoingRequestHook } = buildHttpConfig({
        ignoreOutgoingPaths: ['/health'],
      })
      expect(ignoreOutgoingRequestHook!({ path: undefined })).toBe(false)
    })
  })
  describe('requestHook', () => {
    it('skips IncomingMessage (server-side) requests', () => {
      const { requestHook } = buildHttpConfig({})
      const { span, attrs } = makeSpan()
      requestHook!(span, makeIncomingMessage({ statusCode: 200, headers: {} }))
      expect(Object.keys(attrs)).toHaveLength(0)
    })
    it('sets request attributes for a ClientRequest', () => {
      const { requestHook } = buildHttpConfig({})
      const { span, attrs } = makeSpan()
      requestHook!(
        span,
        makeClientRequest({ host: 'example.com', path: '/api', method: 'GET' })
      )
      expect(attrs[ATTR_SERVER_ADDRESS]).toBe('example.com')
    })
    it('omits port suffix for default http port and updates span name', () => {
      const { requestHook } = buildHttpConfig({ useDescriptiveSpanNames: true })
      const { span, attrs } = makeSpan()
      requestHook!(
        span,
        makeClientRequest({
          host: 'example.com',
          port: 80,
          path: '/page',
          method: 'GET',
        })
      )
      expect(attrs[ATTR_URL_FULL]).toBe('http://example.com/page')
      expect(
        (span.updateName as ReturnType<typeof vi.fn>).mock.calls.length
      ).toBeGreaterThan(0)
    })
    it('does not update span name when useDescriptiveSpanNames is false', () => {
      const { requestHook } = buildHttpConfig({
        useDescriptiveSpanNames: false,
      })
      const { span, name } = makeSpan()
      requestHook!(
        span,
        makeClientRequest({ host: 'example.com', path: '/api', method: 'GET' })
      )
      expect(name).toBe('')
    })
    it('sets network protocol version when agent.protocol is available', () => {
      const { requestHook } = buildHttpConfig({})
      const { span, attrs } = makeSpan()
      requestHook!(
        span,
        makeClientRequest({ host: 'example.com', protocol: 'https:' })
      )
      expect(attrs[ATTR_NETWORK_PROTOCOL_VERSION]).toBe('1.1')
    })
    it('captures configured request headers', () => {
      const { requestHook } = buildHttpConfig({
        captureRequestHeaders: ['x-forwarded-for'],
      })
      const { span, attrs } = makeSpan()
      const req = makeClientRequest({
        host: 'example.com',
      })
      req.setHeader('x-forwarded-for', ['10.0.0.1', '10.0.0.2'])

      requestHook!(span, req)
      expect(attrs['http.request.header.x_forwarded_for']).toEqual([
        '10.0.0.1',
        '10.0.0.2',
      ])
    })
  })
  describe('responseHook', () => {
    it('sets status code attribute', () => {
      const { responseHook } = buildHttpConfig({})
      const { span, attrs } = makeSpan()
      responseHook!(
        span,
        makeIncomingMessage({
          statusCode: 200,
          statusMessage: 'OK',
          headers: {},
        })
      )
      expect(attrs[ATTR_HTTP_RESPONSE_STATUS_CODE]).toBe(200)
    })

    it('does not set attributes for non-IncomingMessage responses', () => {
      const { responseHook } = buildHttpConfig({})
      const { span, attrs } = makeSpan()
      responseHook!(span, new ServerResponse(makeIncomingMessage()))
      expect(Object.keys(attrs)).toHaveLength(0)
    })

    it('sets error status and error.type for 5xx', () => {
      const { responseHook } = buildHttpConfig({})
      const { span, attrs, setStatus } = makeSpan()
      responseHook!(
        span,
        makeIncomingMessage({
          statusCode: 503,
          statusMessage: 'Service Unavailable',
          headers: {},
        })
      )
      expect(setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'HTTP 503',
      })
      expect(attrs[ATTR_ERROR_TYPE]).toBe('503')
    })

    it('sets error.type but not error status for 4xx', () => {
      const { responseHook } = buildHttpConfig({})
      const { span, attrs, setStatus } = makeSpan()
      responseHook!(
        span,
        makeIncomingMessage({
          statusCode: 404,
          statusMessage: 'Not Found',
          headers: {},
        })
      )
      expect(setStatus).not.toHaveBeenCalled()
      expect(attrs[ATTR_ERROR_TYPE]).toBe('404')
    })

    it('captures configured response headers', () => {
      const { responseHook } = buildHttpConfig({
        captureResponseHeaders: ['x-request-id'],
      })
      const { span, attrs } = makeSpan()
      responseHook!(
        span,
        makeIncomingMessage({
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'x-request-id': 'req-abc' },
        })
      )
      expect(attrs['http.response.header.x_request_id']).toEqual(['req-abc'])
    })

    it('sets response body size from content-length header', () => {
      const { responseHook } = buildHttpConfig({})
      const { span, attrs } = makeSpan()
      responseHook!(
        span,
        makeIncomingMessage({
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-length': '1024' },
        })
      )
      expect(attrs[ATTR_HTTP_RESPONSE_BODY_SIZE]).toBe(1024)
    })

    it('sets network peer address and port from socket', () => {
      const { responseHook } = buildHttpConfig({})
      const { span, attrs } = makeSpan()
      responseHook!(
        span,
        makeIncomingMessage({
          statusCode: 200,
          statusMessage: 'OK',
          headers: {},
          socket: {
            remoteAddress: '10.0.0.1',
            remotePort: 443,
          } as Partial<Socket> as Socket,
        })
      )
      expect(attrs[ATTR_NETWORK_PEER_ADDRESS]).toBe('10.0.0.1')
      expect(attrs[ATTR_NETWORK_PEER_PORT]).toBe(443)
    })
  })
})

describe('buildUndiciConfig', () => {
  describe('ignoreRequestHook', () => {
    it('returns false when no paths configured', () => {
      const { ignoreRequestHook } = buildUndiciConfig({})
      expect(ignoreRequestHook!(makeUndiciRequest({ path: '/health' }))).toBe(
        false
      )
    })

    it('ignores requests matching a configured path prefix', () => {
      const { ignoreRequestHook } = buildUndiciConfig({
        ignoreOutgoingPaths: ['/health'],
      })
      expect(ignoreRequestHook!(makeUndiciRequest({ path: '/health' }))).toBe(
        true
      )
      expect(
        ignoreRequestHook!(makeUndiciRequest({ path: '/health/live' }))
      ).toBe(true)
    })

    it('does not ignore requests that do not match', () => {
      const { ignoreRequestHook } = buildUndiciConfig({
        ignoreOutgoingPaths: ['/health'],
      })
      expect(
        ignoreRequestHook!(makeUndiciRequest({ path: '/api/users' }))
      ).toBe(false)
    })

    it('treats missing path as empty string', () => {
      const { ignoreRequestHook } = buildUndiciConfig({
        ignoreOutgoingPaths: ['/health'],
      })
      expect(ignoreRequestHook!(makeUndiciRequest({ path: undefined }))).toBe(
        false
      )
    })
  })

  describe('requestHook', () => {
    it('sets core request attributes', () => {
      const { requestHook } = buildUndiciConfig({})
      const { span, attrs } = makeSpan()
      requestHook!(
        span,
        makeUndiciRequest({
          origin: 'https://api.example.com',
          path: '/v1/items',
          method: 'POST',
          headers: 'content-type: application/json\r\n',
        })
      )
      expect(attrs[ATTR_HTTP_REQUEST_METHOD]).toBe('POST')
      expect(attrs[ATTR_SERVER_ADDRESS]).toBe('api.example.com')
      expect(attrs[ATTR_SERVER_PORT]).toBe(443)
      expect(attrs[ATTR_URL_SCHEME]).toBe('https')
      expect(attrs[ATTR_URL_PATH]).toBe('/v1/items')
      expect(attrs[ATTR_URL_FULL]).toBe('https://api.example.com/v1/items')
    })

    it('reads headers from the raw header string', () => {
      const { requestHook } = buildUndiciConfig({
        captureRequestHeaders: ['x-request-id'],
      })
      const { span, attrs } = makeSpan()
      requestHook!(
        span,
        makeUndiciRequest({
          origin: 'http://svc.internal',
          path: '/',
          method: 'GET',
          headers: 'x-request-id: abc-123\r\n',
        })
      )
      expect(attrs['http.request.header.x_request_id']).toEqual(['abc-123'])
    })

    it('sets url.query for paths with a query string', () => {
      const { requestHook } = buildUndiciConfig({})
      const { span, attrs } = makeSpan()
      requestHook!(
        span,
        makeUndiciRequest({
          origin: 'http://svc.internal',
          path: '/search?q=test&page=2',
          method: 'GET',
          headers: '',
        })
      )
      expect(attrs[ATTR_URL_QUERY]).toBe('q=test&page=2')
    })

    it('sets request body size from content-length header', () => {
      const { requestHook } = buildUndiciConfig({})
      const { span, attrs } = makeSpan()
      requestHook!(
        span,
        makeUndiciRequest({
          origin: 'http://svc.internal',
          path: '/',
          method: 'POST',
          headers: 'content-length: 512\r\n',
        })
      )
      expect(attrs[ATTR_HTTP_REQUEST_BODY_SIZE]).toBe(512)
    })
  })

  describe('responseHook', () => {
    it('sets status code attribute', () => {
      const { responseHook } = buildUndiciConfig({})
      const { span, attrs } = makeSpan()
      responseHook!(span, {
        request: makeUndiciRequest(),
        response: makeUndiciResponse({
          statusCode: 404,
          statusText: 'Not Found',
        }),
      })
      expect(attrs[ATTR_HTTP_RESPONSE_STATUS_CODE]).toBe(404)
    })

    it('captures configured response headers from Buffer pairs', () => {
      const { responseHook } = buildUndiciConfig({
        captureResponseHeaders: ['x-request-id'],
      })
      const { span, attrs } = makeSpan()
      responseHook!(span, {
        request: makeUndiciRequest(),
        response: makeUndiciResponse({
          headers: [Buffer.from('x-request-id'), Buffer.from('req-xyz')],
        }),
      })
      expect(attrs['http.response.header.x_request_id']).toEqual(['req-xyz'])
    })
  })
})
