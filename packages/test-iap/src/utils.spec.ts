import { describe, expect, it } from 'vitest'
import type { Headers, JsonObject } from './types'
import {
  defaultPort,
  flattenHeaders,
  getHeader,
  hasHeader,
  IntrospectionError,
  parseAuthorizationHeader,
  setHeader,
  toHttpBase,
  toWsBase,
} from './utils'

const b64u = (o: unknown) =>
  Buffer.from(JSON.stringify(o)).toString('base64url')

describe('utils', () => {
  it('defaultPort returns 443 for https/wss and 80 otherwise', () => {
    expect(defaultPort(new URL('https://x'))).toBe(443)
    expect(defaultPort(new URL('wss://x'))).toBe(443)
    expect(defaultPort(new URL('http://x'))).toBe(80)
    expect(defaultPort(new URL('ws://x'))).toBe(80)
  })

  it('toHttpBase maps ws->http and wss->https, otherwise returns original', () => {
    expect(toHttpBase(new URL('ws://host:1234'))).toBe('http://host:1234')
    expect(toHttpBase(new URL('wss://host'))).toBe('https://host')
    expect(toHttpBase(new URL('http://a:9'))).toBe('http://a:9/')
    expect(toHttpBase(new URL('https://a'))).toBe('https://a/')
  })

  it('toWsBase maps http->ws and https->wss, otherwise returns original', () => {
    expect(toWsBase(new URL('http://host:1234'))).toBe('ws://host:1234')
    expect(toWsBase(new URL('https://host'))).toBe('wss://host')
    expect(toWsBase(new URL('ws://a:9'))).toBe('ws://a:9/')
    expect(toWsBase(new URL('wss://a'))).toBe('wss://a/')
  })

  it('getHeader returns header value (case-insensitive) or undefined', () => {
    const headers: Headers = {
      Authorization: 'Bearer abc',
      'X-Test': '1',
    } as any
    expect(getHeader(headers, 'authorization')).toBe('Bearer abc')
    expect(getHeader(headers, 'x-test')).toBe('1')
    expect(getHeader(headers, 'missing')).toBeUndefined()
  })

  it('hasHeader is case-insensitive', () => {
    const headers: Headers = { Foo: 'bar' } as any
    expect(hasHeader(headers, 'foo')).toBe(true)
    expect(hasHeader(headers, 'FOO')).toBe(true)
    expect(hasHeader(headers, 'bar')).toBe(false)
  })

  it('setHeader lowercases key and sets value', () => {
    const headers: Headers = {} as any
    setHeader(headers, 'X-Foo', 'bar')
    expect(headers['x-foo']).toBe('bar')
    expect(getHeader(headers, 'x-foo')).toBe('bar')
  })

  it('flattenHeaders flattens strings, arrays, and numbers', () => {
    const headers: Headers = {
      a: '1',
      b: ['x', 'y'],
      c: 42 as any,
    } as any
    const lines = flattenHeaders(headers)
    expect(lines).toEqual(['a: 1', 'b: x', 'b: y', 'c: 42'])
  })

  it('parseAuthorizationHeader returns claims for valid Bearer base64url(JSON)', () => {
    const claims: JsonObject = { sub: 'u-1', sid: 's-2' }
    const header = `Bearer ${b64u(claims)}`
    expect(parseAuthorizationHeader(header)).toEqual(claims)
  })

  it('parseAuthorizationHeader throws IntrospectionError on invalid header', () => {
    const bad = 'Bearer not-b64u-json'
    expect(() => parseAuthorizationHeader(bad)).toThrow(IntrospectionError)
  })

  it('parseAuthorizationHeader throws IntrospectionError on non-object JSON', () => {
    const header = `Bearer ${b64u('just-a-string')}`
    expect(() => parseAuthorizationHeader(header)).toThrow(IntrospectionError)
  })
})
