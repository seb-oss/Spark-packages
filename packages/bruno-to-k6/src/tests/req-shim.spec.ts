// src/req-shim.spec.ts
import { describe, it, expect } from 'vitest'
import { createReqShim, type RequestDraft } from '../req-shim'

const makeDraft = (over: Partial<RequestDraft> = {}): RequestDraft => ({
  method: 'GET',
  url: 'https://api.example.com/x',
  headers: {},
  body: null,
  query: {},
  ...over,
})

describe('createReqShim', () => {
  it('sets and removes headers', () => {
    const draft = makeDraft()
    const req = createReqShim(draft)

    req.setHeader('X-One', '1')
    req.setHeader('X-Two', '2')
    expect(draft.headers).toEqual({ 'X-One': '1', 'X-Two': '2' })

    req.removeHeader('X-One')
    expect(draft.headers).toEqual({ 'X-Two': '2' })
  })

  it('sets single and multiple query params', () => {
    const draft = makeDraft({ url: 'https://api.example.com/search' })
    const req = createReqShim(draft)

    req.setQueryParam('q', 'cats')
    req.setQueryParams({ page: '2', sort: 'asc' })

    expect(draft.query).toEqual({ q: 'cats', page: '2', sort: 'asc' })
  })

  it('overwrites url and body with strings or objects, and supports null body', () => {
    const draft = makeDraft()
    const req = createReqShim(draft)

    req.setUrl('https://api.example.com/y')
    expect(draft.url).toBe('https://api.example.com/y')

    req.setBody('raw-text')
    expect(draft.body).toBe('raw-text')

    req.setBody({ a: 1, b: 'x' })
    expect(draft.body).toBe(JSON.stringify({ a: 1, b: 'x' }))

    req.setBody(null)
    expect(draft.body).toBeNull()
  })

  it('setBearerToken writes Authorization header', () => {
    const draft = makeDraft()
    const req = createReqShim(draft)

    req.setBearerToken('t-123')
    expect(draft.headers.Authorization).toBe('Bearer t-123')
  })

  it('setBasicAuth writes base64-encoded Authorization header', () => {
    const draft = makeDraft()
    const req = createReqShim(draft)

    req.setBasicAuth('alice', 'secret')
    // "alice:secret" base64 is YWxpY2U6c2VjcmV0
    expect(draft.headers.Authorization).toBe('Basic YWxpY2U6c2VjcmV0')
  })

  it('setApiKey writes either header or query based on placement', () => {
    const draft = makeDraft()
    const req = createReqShim(draft)

    req.setApiKey('X-Api-Key', '123') // default: header
    req.setApiKey('api_key', 'qv', 'query') // query param
    expect(draft.headers['X-Api-Key']).toBe('123')
    expect(draft.query['api_key']).toBe('qv')
  })

  it('mutates the provided draft by reference (no copies)', () => {
    const draft = makeDraft()
    const req = createReqShim(draft)

    req.setHeader('A', '1')
    req.setQueryParam('p', 'v')
    req.setBody({ ok: true })

    expect(draft).toMatchObject({
      headers: { A: '1' },
      query: { p: 'v' },
      body: JSON.stringify({ ok: true }),
    })
  })
})
