import { describe, it, expect } from 'vitest'
import {
  mergeEnvs,
  parseBruSource,
  parseBrunoEnvSource,
  parseDotenvSource,
} from '../parse'

describe('parseBruSource', () => {
  describe('basic request', () => {
    it('parses method and url from a get block', () => {
      const src = `
get {
  url: https://api.example.com/users
}
`
      const ir = parseBruSource(src, { path: '/abs/collection/users.bru' })
      expect(ir.method).toBe('GET')
      expect(ir.url).toBe('https://api.example.com/users')
      expect(ir.path).toBe('/abs/collection/users.bru')
    })
    it('keeps variable templating in url', () => {
      const src = `
post {
  url: https://api.example.com/users/{{userId}}/posts
}
`
      const ir = parseBruSource(src)
      expect(ir.method).toBe('POST')
      expect(ir.url).toBe('https://api.example.com/users/{{userId}}/posts')
    })
  })
  describe('headers', () => {
    it('collects headers and marks disabled entries', () => {
      const src = `
get {
  url: https://api.example.com
}

headers {
  Authorization: Bearer {{token}}
  ~X-Debug: 1
  Content-Type: application/json
}
`
      const ir = parseBruSource(src)
      expect(ir.headers).toEqual([
        { key: 'Authorization', value: 'Bearer {{token}}', disabled: false },
        { key: 'X-Debug', value: '1', disabled: true },
        { key: 'Content-Type', value: 'application/json', disabled: false },
      ])
    })
  })
  describe('params (query)', () => {
    it('maps params block to a key/value record and ignores disabled', () => {
      const src = `
get {
  url: https://api.example.com/search
}

params:query {
  q: cats
  page: 2
  ~ignored: nope
}
`
      const ir = parseBruSource(src)
      expect(ir.params).toEqual({ q: 'cats', page: '2' })
    })
  })
  describe('body modes', () => {
    it('parses raw json and infers application/json mime', () => {
      const src = `
post {
  url: https://api.example.com/users
}

body {
  { "name": "Alice", "age": 42 }
}
`
      const ir = parseBruSource(src)
      expect(ir.body?.mode).toBe('raw')
      expect(ir.body?.mime).toBe('application/json')
      expect(ir.body?.text?.trim()).toEqual('{ "name": "Alice", "age": 42 }')
    })
    it('parses form fields', () => {
      const src = `
post {
  url: https://api.example.com/login
}

body:form-urlencoded {
  username: alice
  password: secret
}
`
      const ir = parseBruSource(src)
      expect(ir.body?.mode).toBe('form')
      expect(ir.body?.fields).toEqual({ username: 'alice', password: 'secret' })
    })
    it('parses multipart fields', () => {
      const src = `
post {
  url: https://api.example.com/upload
}

body:multipart-form {
  meta: {"type":"doc"}
  file: {{filePath}}
}
`
      const ir = parseBruSource(src)
      expect(ir.body?.mode).toBe('multipart')
      expect(ir.body?.fields).toEqual({
        meta: '{"type":"doc"}',
        file: '{{filePath}}',
      })
    })
    it('parses graphql as its own mode with raw text', () => {
      const src = `
post {
  url: https://api.example.com/graphql
}

body:graphql {
  { "query": "query Q { me { id } }", "variables": {} }
}
`
      const ir = parseBruSource(src)
      expect(ir.body?.mode).toBe('graphql')
      expect(ir.body?.text).toEqual(
        '{ "query": "query Q { me { id } }", "variables": {} }'
      )
    })
    it('parses raw text body and leaves mime undefined when not JSON', () => {
      const src = `
post {
  url: https://api.example.com/ingest
}

body {
  hello=world&x=1
}
      `
      const ir = parseBruSource(src)
      expect(ir.body?.mode).toBe('raw')
      expect(ir.body?.mime).toBeUndefined()
      expect(ir.body?.text?.trim()).toBe('hello=world&x=1')
    })
  })
  describe('auth', () => {
    it('maps bearer auth', () => {
      const src = `
get {
  url: https://api.example.com
}

auth:bearer {
  token: {{token}}
}
`
      const ir = parseBruSource(src)
      expect(ir.auth).toEqual({ type: 'bearer', data: { token: '{{token}}' } })
    })
    it('maps basic auth', () => {
      const src = `
get {
  url: https://api.example.com
}

auth:basic {
  username: alice
  password: s3cr3t
}
`
      const ir = parseBruSource(src)
      expect(ir.auth).toEqual({
        type: 'basic',
        data: { username: 'alice', password: 's3cr3t' },
      })
    })
    it('maps apikey auth with custom header name', () => {
      const src = `
get {
  url: https://api.example.com
}

auth:apikey {
  name: X-Api-Key
  value: 123
}
`
      const ir = parseBruSource(src)
      expect(ir.auth).toEqual({
        type: 'apikey',
        data: { name: 'X-Api-Key', value: '123' },
      })
    })
  })
  describe('scripts', () => {
    it('captures pre and post script blocks (top-level blocks)', () => {
      const src = `
get {
  url: https://api.example.com
}

script:pre-request {
  req.setHeader("Authorization", "{{token}}");
}

script:post-response {
  const j = res.json();
  expect(j.ok).to.equal(true);
}
`
      const ir = parseBruSource(src)
      expect(ir.pre?.trim()).toEqual(
        'req.setHeader("Authorization", "{{token}}");'
      )
      expect(ir.post?.trim()).toEqual(
        'const j = res.json();\nexpect(j.ok).to.equal(true);'
      )
    })
  })
  describe('tests block (top-level)', () => {
    it('parses status equality test from a top-level tests block', () => {
      const src = `
get {
  url: https://api.example.com
}

tests {
  expect(res.status).to.equal(200)
}
`
      const ir = parseBruSource(src)
      expect(ir.tests.length).toBe(1)
      expect(ir.tests[0]).toMatchObject({
        kind: 'statusEq',
        args: { code: 200 },
      })
    })
    it('parses json path equality and body contains into separate tests', () => {
      const src = `
get {
  url: https://api.example.com
}

tests {
  expect(json.data.id).to.equal("abc")
  expect(res.body).to.contain("welcome")
}
`
      const ir = parseBruSource(src)
      expect(ir.tests.map((t) => t.kind)).toEqual(['jsonPathEq', 'contains'])
      expect(ir.tests[0]).toMatchObject({
        kind: 'jsonPathEq',
        args: { path: 'data.id', value: '"abc"' },
      })
      expect(ir.tests[1]).toMatchObject({
        kind: 'contains',
        args: { value: '"welcome"' },
      })
    })
    it('treats unknown assertions as custom for manual translation', () => {
      const src = `
get {
  url: https://api.example.com
}

tests {
  pm.test("latency p95 < 300ms", () => {/* complex */})
}
`
      const ir = parseBruSource(src)
      expect(ir.tests.length).toBe(1)
      expect(ir.tests[0].kind).toBe('custom')
      expect(ir.tests[0].raw).toEqual(
        'pm.test("latency p95 < 300ms", () => {/* complex */})'
      )
    })
  })
  describe('naming and metadata', () => {
    it('uses explicit name override when provided', () => {
      const src = `
get {
  url: https://api.example.com/x
}
`
      const ir = parseBruSource(src, {
        name: 'explicit-name',
        path: '/x/y/z.bru',
      })
      expect(ir.name).toBe('explicit-name')
      expect(ir.path).toBe('/x/y/z.bru')
    })
    it('defaults name to "request" when no path or ast name present', () => {
      const src = `
get {
  url: https://api.example.com/x
}
`
      const ir = parseBruSource(src)
      expect(ir.name).toBe('request')
    })
  })
  describe('complex request', () => {
    it('handles a complex request', () => {
      const src = `
meta {
  name: Create (Cost and Charges)
  type: http
  seq: 2
}

post {
  url: {{host}}/trpc/orders.createCostAndCharges
  body: json
  auth: none
}

headers {
  Authorization: Bearer {{accessToken}}
}

body:json {
  {
    "accountId": "{{accountId}}",
    "accountType": "109",
    "side": "B",
    "mic": "XSTO",
    "isin": "SE0000108656",
    "price": {
      "amount": 600,
      "currencyCode": "SEK"
    },
    "quantity": 450,
    "validUntil": "{{today}}"
  }
}

script:pre-request {
  const { v4 } = require('uuid')
  const now = new Date()
  
  bru.setEnvVar("requestId", v4().split('-')[1])
  bru.setEnvVar("today", now.toISOString().split('T')[0])
  
}
      `

      const ir = parseBruSource(src)

      // exact top-level metadata
      expect(ir.method).toBe('POST')
      expect(ir.url).toBe('{{host}}/trpc/orders.createCostAndCharges')
      expect(ir.name).toBe('Create (Cost and Charges)')
      expect(ir.seq).toBe(2)
      expect(ir.path).toBe('') // no path provided to parser

      // headers (order and disabled flags)
      expect(ir.headers).toEqual([
        {
          key: 'Authorization',
          value: 'Bearer {{accessToken}}',
          disabled: false,
        },
      ])

      // params & auth
      expect(ir.params).toEqual({})
      expect(ir.auth).toBeUndefined()

      // body:json -> raw with application/json and exact payload semantics
      expect(ir.body?.mode).toBe('raw')
      expect(ir.body?.mime).toBe('application/json')
      expect(typeof ir.body?.text).toBe('string')
      const parsed = JSON.parse(ir.body!.text!)
      expect(parsed).toEqual({
        accountId: '{{accountId}}',
        accountType: '109',
        side: 'B',
        mic: 'XSTO',
        isin: 'SE0000108656',
        price: { amount: 600, currencyCode: 'SEK' },
        quantity: 450,
        validUntil: '{{today}}',
      })

      // pre script must be captured (compare trimmed code)
      const expectedPre = `
const { v4 } = require('uuid')
const now = new Date()

bru.setEnvVar("requestId", v4().split('-')[1])
bru.setEnvVar("today", now.toISOString().split('T')[0])
    `.trim()
      expect(ir.pre?.trim()).toBe(expectedPre)

      // no post script, no tests
      expect(ir.post).toBeUndefined()
      expect(ir.tests).toEqual([])
    })
  })
})

describe('parseBrunoEnvSource — vars-only files', () => {
  it('parses env files that only contain a vars block', () => {
    const src = `
vars {
  API_URL: https://api.local
  TOKEN: abc123
  ~DEBUG: 1
}
`
    const out = parseBrunoEnvSource(src)
    expect(out.name).toBeUndefined()
    expect(out.vars).toEqual({
      API_URL: 'https://api.local',
      TOKEN: 'abc123',
    })
  })
})

describe('parseDotenvSource', () => {
  it('parses basic key=value lines', () => {
    const src = `
API_URL=https://api.staging.local
TOKEN=stg-456

# comment
EMPTY=
`
    const out = parseDotenvSource(src)
    expect(out.name).toBeUndefined()
    expect(out.vars).toEqual({
      API_URL: 'https://api.staging.local',
      TOKEN: 'stg-456',
      EMPTY: '',
    })
  })
  it('coerces values to strings', () => {
    const src = `
PORT=8080
RETRIES=0
FLAG=true
`
    const out = parseDotenvSource(src)
    expect(out.vars).toEqual({
      PORT: '8080',
      RETRIES: '0',
      FLAG: 'true',
    })
  })
  it('handles whitespace and blank lines', () => {
    const src = `

   A = 1

B=2   
   C =3
`
    const out = parseDotenvSource(src)
    expect(out.vars).toEqual({
      A: '1',
      B: '2',
      C: '3',
    })
  })
})

describe('mergeEnvs', () => {
  it('merges left-to-right with later values overriding', () => {
    const base = { API_URL: 'http://local', TOKEN: 'base', LANG: 'sv' }
    const env = { TOKEN: 'dev', DEBUG: '1' }
    const over = { DEBUG: '0' }
    const merged = mergeEnvs(base, env, over)
    expect(merged).toEqual({
      API_URL: 'http://local',
      TOKEN: 'dev',
      LANG: 'sv',
      DEBUG: '0',
    })
  })
  it('ignores undefined inputs and does not mutate sources', () => {
    const a = { A: '1' }
    const b = { B: '2' }
    const merged = mergeEnvs(a, undefined, b)
    expect(merged).toEqual({ A: '1', B: '2' })
    // verify immutability of inputs
    expect(a).toEqual({ A: '1' })
    expect(b).toEqual({ B: '2' })
  })
  it('returns empty object when no maps provided', () => {
    const merged = mergeEnvs()
    expect(merged).toEqual({})
  })
})
