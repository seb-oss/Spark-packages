import {
  UndiciRequest,
  UndiciResponse,
} from '@opentelemetry/instrumentation-undici'
import { describe, expect, it } from 'vitest'
import {
  normUndiciRequest,
  normUndiciResponse,
  parseUndiciRequestHeaders,
  parseUndiciResponseHeaders,
} from './normalize-undici'

describe('normUndiciRequest', () => {
  it('should normalize request fields correctly', () => {
    const req: UndiciRequest = {
      method: 'GET',
      origin: 'https://example.com:8443',
      path: '/test',
      headers: ['Accept', 'text/html', 'X-Custom', ['a', 'b']],
      addHeader: () => {},
      throwOnError: false,
      completed: false,
      aborted: false,
      idempotent: true,
      contentLength: 10,
      contentType: '',
      body: null,
    }

    const normalized = normUndiciRequest(req)

    expect(normalized.method).toBe('GET')
    expect(normalized.hostname).toBe('example.com')
    expect(normalized.port).toBe(8443)
    expect(normalized.protocol).toBe('https')
    expect(normalized.path).toBe('/test')

    expect(normalized.getHeader('accept')).toEqual(['text/html'])
    expect(normalized.getHeader('x-custom')).toEqual(['a', 'b'])
    expect(normalized.getHeader('missing')).toBeUndefined()
  })
  it('should default ports correctly for http and https', () => {
    const httpsReq: UndiciRequest = {
      method: 'GET',
      origin: 'https://secure.com',
      path: '/',
      headers: [],
      addHeader: () => {},
      throwOnError: false,
      completed: false,
      aborted: false,
      idempotent: true,
      contentLength: null,
      contentType: null,
      body: null,
    }

    const httpReq: UndiciRequest = {
      method: 'GET',
      origin: 'http://plain.com',
      path: '/',
      headers: [],
      addHeader: () => {},
      throwOnError: false,
      completed: false,
      aborted: false,
      idempotent: true,
      contentLength: null,
      contentType: null,
      body: null,
    }

    expect(normUndiciRequest(httpsReq).port).toBe(443)
    expect(normUndiciRequest(httpReq).port).toBe(80)
  })
})
describe('normUndiciResponse', () => {
  it('should normalize response fields correctly', () => {
    const res: UndiciResponse = {
      statusCode: 200,
      statusText: 'OK',
      headers: [Buffer.from('Content-Type'), Buffer.from('text/html')],
    }

    const normalized = normUndiciResponse(res)

    expect(normalized.statusCode).toBe(200)
    expect(normalized.statusMessage).toBe('OK')
    expect(normalized.getHeader('content-type')).toEqual(['text/html'])
    expect(normalized.getHeader('missing')).toBeUndefined()
  })
  it('should handle multiple values for same header', () => {
    const res: UndiciResponse = {
      statusCode: 200,
      statusText: 'OK',
      headers: [
        Buffer.from('set-cookie'),
        Buffer.from('a=1'),
        Buffer.from('set-cookie'),
        Buffer.from('b=2'),
      ],
    }

    const normalized = normUndiciResponse(res)

    expect(normalized.getHeader('set-cookie')).toEqual(['a=1', 'b=2'])
  })
})
describe('normalizeRequestHeaders', () => {
  it('should handle string headers', () => {
    const input = 'Content-Type: application/json'
    const output = parseUndiciRequestHeaders(input)
    expect(output).toEqual({ 'content-type': ['application/json'] })
  })
  it('should handle array headers', () => {
    const input = ['Accept', 'text/html', 'X-Custom', ['a', 'b']]
    const output = parseUndiciRequestHeaders(input)
    expect(output).toEqual({ accept: ['text/html'], 'x-custom': ['a', 'b'] })
  })
  it('should skip invalid entries', () => {
    const input = ['Accept', null, 'X-Custom']
    const output = parseUndiciRequestHeaders(input as any)
    expect(output).toEqual({})
  })
})
describe('parseUndiciResponseHeaders', () => {
  it('should convert Buffer headers to record', () => {
    const input = [Buffer.from('Content-Type'), Buffer.from('text/html')]
    const output = parseUndiciResponseHeaders(input)
    expect(output).toEqual({ 'content-type': ['text/html'] })
  })

  it('should handle multiple values for same key', () => {
    const input = [
      Buffer.from('set-cookie'),
      Buffer.from('a=1'),
      Buffer.from('set-cookie'),
      Buffer.from('b=2'),
    ]
    const output = parseUndiciResponseHeaders(input)
    expect(output).toEqual({ 'set-cookie': ['a=1', 'b=2'] })
  })

  it('should skip empty keys or values', () => {
    const input = [
      Buffer.from(''),
      Buffer.from('value'),
      Buffer.from('X'),
      Buffer.from(''),
    ]
    const output = parseUndiciResponseHeaders(input)
    expect(output).toEqual({})
  })

  it('should skip pairs where valBuf is missing (odd-length array)', () => {
    const input = [Buffer.from('X-Header')] as Buffer<ArrayBufferLike>[]
    const output = parseUndiciResponseHeaders(input)
    expect(output).toEqual({})
  })
})
