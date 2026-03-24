import { describe, expect, it } from 'vitest'
import { serializeBody } from './serialize-body'

const params = (body: unknown) =>
  ({ method: 'POST', path: '/_search', body }) as any

describe('serializeBody', () => {
  it('returns undefined when body is absent', () => {
    expect(serializeBody(params(undefined), {})).toBeUndefined()
  })

  it('returns undefined when body is an empty string', () => {
    expect(serializeBody(params(''), {})).toBeUndefined()
  })

  it('returns undefined when dbStatementSerializer is false', () => {
    expect(
      serializeBody(params({ query: {} }), { dbStatementSerializer: false })
    ).toBeUndefined()
  })

  it('JSON-stringifies an object body by default', () => {
    const body = { query: { match_all: {} } }
    expect(serializeBody(params(body), {})).toBe(JSON.stringify(body))
  })

  it('returns a string body as-is', () => {
    expect(serializeBody(params('{"query":{}}'), {})).toBe('{"query":{}}')
  })

  it('calls a custom serializer function when provided', () => {
    const serializer = () => 'redacted'
    expect(
      serializeBody(params({ query: {} }), {
        dbStatementSerializer: serializer,
      })
    ).toBe('redacted')
  })

  it('passes the full params object to the custom serializer', () => {
    let received: unknown
    const serializer = (p: unknown) => {
      received = p
      return 'ok'
    }
    const p = params({ query: {} })
    serializeBody(p, { dbStatementSerializer: serializer })
    expect(received).toBe(p)
  })
})
