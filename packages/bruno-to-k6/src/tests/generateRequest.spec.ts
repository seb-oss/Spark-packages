import { describe, expect, it } from 'vitest'
import { generateRequest } from '../generate/generate-request'
import { mkReq, norm } from './helpers'

describe('generateRequest', () => {
  it('generates GET with no body/headers/params', () => {
    const req = mkReq({
      http: { method: 'get', url: 'https://example.test', auth: 'inherit' },
    })

    const out = generateRequest(req).join('\n')
    expect(norm(out)).toBe(
      norm(`
  // GET https://example.test
  const res = http.request(
    'GET',
    parse.url('https://example.test'),
  )
  check(res, {'status < 400': r => r.status < 400})
`)
    )
  })
  describe('url', () => {
    it('appends query params to URL (encodeUrl=true baseline)', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/search',
          auth: 'inherit',
        },
        params: [
          {
            name: 'q',
            value: 'txt',
            type: 'query',
            enabled: true,
          },
          {
            name: 'page',
            value: '1',
            type: 'query',
            enabled: true,
          },
          {
            name: 'hidden',
            value: 'none',
            type: 'query',
            enabled: false,
          },
        ],
      })

      const out = generateRequest(req).join('\n')
      expect(norm(out)).toContain(
        `parse.url('https://example.test/search?q=txt&page=1')`
      )
    })
    it('URL-encodes query parameter values', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/search',
          auth: 'inherit',
        },
        params: [
          { name: 'q', value: 'spaced value', type: 'query', enabled: true },
          { name: 'x', value: 'a&b', type: 'query', enabled: true },
        ],
      })
      const out = generateRequest(req).join('\n')
      expect(norm(out)).toContain(
        `parse.url('https://example.test/search?q=spaced%20value&x=a%26b')`
      )
    })
    it('replaces path params in URL (enabled path params)', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/items/:id/comments/:cid',
          auth: 'inherit',
        },
        params: [
          { name: 'id', value: '123', type: 'path', enabled: true },
          { name: 'cid', value: '9', type: 'path', enabled: true },
          // should be ignored:
          { name: 'id', value: 'zzz', type: 'path', enabled: false },
          { name: 'q', value: 'x', type: 'query', enabled: true },
        ],
      })

      const out = generateRequest(req).join('\n')
      expect(norm(out)).toContain(
        `parse.url('https://example.test/items/123/comments/9?q=x')`
      )
    })
    it('replaces multiple occurrences of a path param and URL-encodes it', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/items/:id/ref/:id',
          auth: 'inherit',
        },
        params: [{ name: 'id', value: 'A B', type: 'path', enabled: true }],
      })
      const out = generateRequest(req).join('\n')
      expect(norm(out)).toContain(
        `parse.url('https://example.test/items/A%20B/ref/A%20B')`
      )
    })
    it('respects settings.encodeUrl=false (no percent-encoding for path/query)', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/items/:id',
          auth: 'inherit',
        },
        settings: { encodeUrl: false },
        params: [
          { name: 'id', value: 'A B', type: 'path', enabled: true },
          { name: 'q', value: 'a&b c', type: 'query', enabled: true },
          { name: 'x', value: '100% free', type: 'query', enabled: true },
        ],
      })

      const out = generateRequest(req).join('\n')
      expect(norm(out)).toContain(
        `parse.url('https://example.test/items/A B?q=a&b c&x=100% free')`
      )
    })
  })
  describe('headers', () => {
    it('includes only enabled headers (ignores disabled)', () => {
      const req = mkReq({
        http: { method: 'get', url: 'https://example.test', auth: 'inherit' },
        headers: [
          { name: 'X-Api-Key', value: '123', enabled: true },
          { name: 'X-Skip-Me', value: 'nope', enabled: false },
          { name: 'Content-Type', value: 'application/json', enabled: true },
        ],
      })

      const out = generateRequest(req).join('\n')

      expect(norm(out)).toContain(
        norm(`
  const res = http.request(
    'GET',
    parse.url('https://example.test'),
    undefined,
    parse.params({headers: {'X-Api-Key': '123', 'Content-Type': 'application/json'}}),
  )
        `)
      )
    })
    it('populates Authorization header (when not explicitly set) for Bearer auth', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/secure',
          auth: 'inherit',
        },
        auth: { bearer: { token: '{{token}}' } },
      })

      const out = generateRequest(req).join('\n')
      expect(norm(out)).toBe(
        norm(`
  // GET https://example.test/secure
  const res = http.request(
    'GET',
    parse.url('https://example.test/secure'),
    undefined,
    parse.params({headers: {Authorization: 'Bearer {{token}}'}}),
  )
  check(res, {'status < 400': r => r.status < 400})
      `)
      )
    })
    it('does not overwrite explicit Authorization header when bearer auth is set', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/secure',
          auth: 'inherit',
        },
        headers: [
          { name: 'Authorization', value: 'Custom token', enabled: true },
        ],
        auth: { bearer: { token: '{{token}}' } },
      })

      const out = generateRequest(req).join('\n')
      expect(norm(out)).toContain(
        `parse.params({headers: {Authorization: 'Custom token'}})`
      )
      expect(out).not.toContain('Bearer {{token}}')
    })
    it('populates Authorization header (no explicit header) for Basic auth', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/basic',
          auth: 'inherit',
        },
        auth: { basic: { username: 'alice', password: 'secret' } },
      })

      const out = generateRequest(req).join('\n')
      expect(norm(out)).toBe(
        norm(`
  // GET https://example.test/basic
  const res = http.request(
    'GET',
    parse.url('https://example.test/basic'),
    undefined,
    parse.params({headers: {Authorization: 'Basic YWxpY2U6c2VjcmV0'}}),
  )
  check(res, {'status < 400': r => r.status < 400})
      `)
      )
    })
    it('does not overwrite explicit Authorization header when Basic auth is set', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/basic',
          auth: 'inherit',
        },
        headers: [
          { name: 'Authorization', value: 'Custom token', enabled: true },
        ],
        auth: { basic: { username: 'alice', password: 'secret' } },
      })

      const out = generateRequest(req).join('\n')
      expect(norm(out)).toContain(
        `parse.params({headers: {Authorization: 'Custom token'}})`
      )
      expect(out).not.toContain('Basic')
    })
    it('populates Authorization header (when not explicitly set) for Digest auth', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/digest',
          auth: 'inherit',
        },
        auth: { digest: { username: 'alice', password: 'secret' } },
        settings: { encodeUrl: true },
      })

      const out = generateRequest(req).join('\n')

      expect(norm(out)).toBe(
        norm(`
  // GET https://example.test/digest
  const res = http.request(
    'GET',
    parse.url('https://example.test/digest'),
    undefined,
    parse.params({headers: {Authorization: 'Digest \${bru.digestAuth(ENV, 'alice', 'secret')}'}}),
  )
  check(res, {'status < 400': r => r.status < 400})
      `)
      )
    })
    it('populates Authorization header for OAuth2 (header placement, Bearer prefix) and ignores extra param blocks as headers', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/oauth',
          auth: 'inherit',
        },
        auth: {
          oauth2: {
            grantType: 'authorization_code',
            callbackUrl: 'https://example.test/oauth/callback',
            authorizationUrl: 'https://example.test/oauth/authorize',
            accessTokenUrl: 'https://example.test/token',
            refreshTokenUrl: 'https://example.test/oauth/token/refresh',
            clientId: '{{clientId}}',
            clientSecret: '{{secret}}',
            scope: 'read:all',
            state: 'none',
            pkce: true,
            credentialsPlacement: 'basic_auth_header',
            credentialsId: 'credentials',
            tokenPlacement: 'header',
            tokenHeaderPrefix: 'Bearer',
            autoFetchToken: true,
            autoRefreshToken: true,
          },
        },
        // extra blocks are top-level in Bruno’s parsed shape:
        oauth2_additional_parameters_auth_req_headers: [
          { name: 'extra-key', value: 'extra-value', enabled: true },
        ],
        oauth2_additional_parameters_access_token_req_queryparams: [
          { name: 'extra-key', value: 'extra-value', enabled: true },
        ],
        oauth2_additional_parameters_refresh_token_req_bodyvalues: [
          { name: 'extra-key', value: 'extra-value', enabled: true },
        ],
        settings: { encodeUrl: true },
      })

      const out = generateRequest(req).join('\n')

      // main expectation: Authorization header via runtime helper + Bearer prefix
      expect(norm(out)).toContain(
        `parse.params({headers: {Authorization: 'Bearer \${bru.oauth2Token(ENV, 'credentials')}'}})`
      )

      // ensure the "extra" params don't appear as outgoing request headers
      expect(out).not.toContain('extra-key')
      expect(out).not.toContain('extra-value')
    })
    it('adds API key header unless explicitly provided', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/with-apikey',
          auth: 'inherit',
        },
        auth: {
          apikey: { key: 'X-Api-Key', value: '123', placement: 'header' },
        },
      })

      const out = generateRequest(req).join('\n')
      expect(norm(out)).toBe(
        norm(`
  // GET https://example.test/with-apikey
  const res = http.request(
    'GET',
    parse.url('https://example.test/with-apikey'),
    undefined,
    parse.params({headers: {'X-Api-Key': '123'}}),
  )
  check(res, {'status < 400': r => r.status < 400})
      `)
      )
    })
    it('does not overwrite explicit API key header if already provided', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/with-apikey',
          auth: 'inherit',
        },
        headers: [
          { name: 'X-Api-Key', value: 'explicit-override', enabled: true },
        ],
        auth: {
          apikey: { key: 'X-Api-Key', value: '123', placement: 'header' },
        },
      })

      const out = generateRequest(req).join('\n')

      expect(norm(out)).toContain(
        `parse.params({headers: {'X-Api-Key': 'explicit-override'}})`
      )
      expect(out).not.toContain(`'123'`)
    })
    it('does not inject API key header when placement is not header', () => {
      const req = mkReq({
        http: {
          method: 'get',
          url: 'https://example.test/with-apikey',
          auth: 'inherit',
        },
        auth: { apikey: { key: 'apiKey', value: '123', placement: 'query' } },
      })
      const out = generateRequest(req).join('\n')
      expect(out).not.toContain('X-Api-Key')
    })
  })
  describe('body', () => {
    describe('Form URL Encoded', () => {
      it('puts fields in body and sets Content-Type', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/login',
            auth: 'inherit',
            body: 'formUrlEncoded',
          },
          body: {
            formUrlEncoded: [
              { name: 'username', value: 'alice', enabled: true },
              { name: 'password', value: 'secret', enabled: true },
            ],
          } as any,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toBe(
          norm(`
  // POST https://example.test/login
  const res = http.request(
    'POST',
    parse.url('https://example.test/login'),
    parse.body({username: 'alice', password: 'secret'}),
    parse.params({headers: {'Content-Type': 'application/x-www-form-urlencoded'}}),
  )
  check(res, {'status < 400': r => r.status < 400})
        `)
        )
      })
      it('ignores disabled; empty yields {} and sets header', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/login',
            auth: 'inherit',
            body: 'formUrlEncoded',
          },
          body: {
            formUrlEncoded: [
              { name: 'u', value: 'alice', enabled: false },
              { name: 'p', value: 'secret', enabled: false },
            ],
          } as any,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toContain(`parse.body({}),`)
        expect(norm(out)).toContain(
          `parse.params({headers: {'Content-Type': 'application/x-www-form-urlencoded'}}),`
        )
      })
    })
    describe('Multipart Form', () => {
      it('emits object body (no Content-Type auto)', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/upload',
            auth: 'inherit',
            body: 'multipartForm',
          },
          body: {
            multipartForm: [
              {
                name: 'meta',
                value: `{'type':'doc'}`,
                type: 'text',
                enabled: true,
              },
              {
                name: 'file',
                value: '{{filePath}}',
                type: 'text',
                enabled: true,
              },
            ],
          } as any,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toBe(
          norm(`
  // POST https://example.test/upload
  const res = http.request(
    'POST',
    parse.url('https://example.test/upload'),
    parse.body({meta: {type: 'doc'}, file: '{{filePath}}'}),
  )
  check(res, {'status < 400': r => r.status < 400})
        `)
        )
      })
      it('ignores disabled parts', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/upload',
            auth: 'inherit',
            body: 'multipartForm',
          },
          body: {
            multipartForm: [
              { name: 'keep', value: 'ok', type: 'text', enabled: true },
              { name: 'skip', value: 'nope', type: 'text', enabled: false },
            ],
          } as any,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toBe(
          norm(`
  // POST https://example.test/upload
  const res = http.request(
    'POST',
    parse.url('https://example.test/upload'),
    parse.body({keep: 'ok'}),
  )
  check(res, {'status < 400': r => r.status < 400})
        `)
        )
      })
      it('coerces simple JSON-like text parts (single quotes) into objects', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/upload',
            auth: 'inherit',
            body: 'multipartForm',
          },
          body: {
            multipartForm: [
              {
                name: 'meta',
                value: `{'a':1,'b':'x'}`,
                type: 'text',
                enabled: true,
              },
              { name: 'note', value: 'raw', type: 'text', enabled: true },
            ],
          } as any,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toBe(
          norm(`
  // POST https://example.test/upload
  const res = http.request(
    'POST',
    parse.url('https://example.test/upload'),
    parse.body({meta: {a: 1, b: 'x'}, note: 'raw'}),
  )
  check(res, {'status < 400': r => r.status < 400})
        `)
        )
        expect(out).not.toContain('Content-Type')
      })
      it('empty/disabled-only multipart yields {} and no Content-Type header', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/upload',
            auth: 'inherit',
            body: 'multipartForm',
          },
          body: {
            multipartForm: [
              { name: 'x', value: '1', type: 'text', enabled: false },
            ],
          } as any,
        })
        const out = generateRequest(req).join('\n')
        expect(out).not.toContain('Content-Type')
      })
    })
    describe('JSON', () => {
      it('emits object literal + Content-Type header', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/items',
            auth: 'inherit',
            body: 'json',
          },
          body: { json: `{\n  "name": "Widget"\n}` },
          headers: undefined,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toBe(
          norm(`
  // POST https://example.test/items
  const res = http.request(
    'POST',
    parse.url('https://example.test/items'),
    parse.body({name: 'Widget'}),
    parse.params({headers: {'Content-Type': 'application/json'}}),
  )
  check(res, {'status < 400': r => r.status < 400})
        `)
        )
      })
      it('does not override explicit Content-Type', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/items',
            auth: 'inherit',
            body: 'json',
          },
          headers: [
            { name: 'Content-Type', value: 'text/plain', enabled: true },
          ],
          body: { json: `{"name":"Widget"}` },
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toContain(
          norm(`
    parse.body({name: 'Widget'}),
    parse.params({headers: {'Content-Type': 'text/plain'}}),
        `)
        )
      })
      it('invalid JSON → falls back to string body and still sets application/json', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/items',
            auth: 'inherit',
            body: 'json',
          },
          body: { json: `{ invalid json` },
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toContain(`parse.body('{ invalid json'),`)
        expect(norm(out)).toContain(
          `parse.params({headers: {'Content-Type': 'application/json'}}),`
        )
      })
    })
    describe('XML', () => {
      it('emits raw XML as a string (no header auto)', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/xml',
            auth: 'inherit',
            body: 'xml',
          },
          body: { xml: `<note><to>Alice</to></note>` } as any,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toContain(
          `parse.body('<note><to>Alice</to></note>'),`
        )
        expect(out).not.toContain('Content-Type')
      })
    })
    describe('TEXT', () => {
      it('emits raw text as a string (no header auto)', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/raw',
            auth: 'inherit',
            body: 'text',
          },
          body: { text: `hello=world&x=1` } as any,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toContain(`parse.body('hello=world&x=1'),`)
        expect(out).not.toContain('Content-Type')
      })
    })
    describe('SPARQL', () => {
      it('emits sparql as a string (no header auto)', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/sparql',
            auth: 'inherit',
            body: 'sparql',
          },
          body: { sparql: 'SELECT * WHERE { ?s ?p ?o }' },
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toContain(
          `parse.body('SELECT * WHERE { ?s ?p ?o }'),`
        )
        expect(out).not.toContain('Content-Type')
      })
    })
    describe('GraphQL', () => {
      it('emits {query: "..."} + sets Content-Type application/json', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/graphql',
            auth: 'inherit',
            body: 'graphql',
          },
          body: {
            graphql: { query: `query Q { me { id } }`, variables: `{}` },
          },
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toBe(
          norm(`
  // POST https://example.test/graphql
  const res = http.request(
    'POST',
    parse.url('https://example.test/graphql'),
    parse.body({query: 'query Q { me { id } }'}),
    parse.params({headers: {'Content-Type': 'application/json'}}),
  )
  check(res, {'status < 400': r => r.status < 400})
        `)
        )
      })
      it('missing query → sends {query: ""} and sets JSON header', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/graphql',
            auth: 'inherit',
            body: 'graphql',
          },
          body: { graphql: { query: '' } },
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toContain(`parse.body({query: ''}),`)
        expect(norm(out)).toContain(
          `parse.params({headers: {'Content-Type': 'application/json'}}),`
        )
      })
      it('includes both query and variables when provided', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/graphql',
            auth: 'inherit',
            body: 'graphql',
          },
          body: {
            graphql: {
              query: `query Q { user(id:1){ name } }`,
              variables: `{"limit":5}`,
            },
          },
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toContain(
          `parse.body({query: 'query Q { user(id:1){ name } }', variables: '{\"limit\":5}'})`
        )
        expect(norm(out)).toContain(
          `parse.params({headers: {'Content-Type': 'application/json'}}),`
        )
      })
    })
    describe('No Body', () => {
      it('omits body/params when body mode is none', () => {
        const req = mkReq({
          http: {
            method: 'post',
            url: 'https://example.test/nobody',
            auth: 'inherit',
          },
          body: {} as any,
        })
        const out = generateRequest(req).join('\n')
        expect(norm(out)).toBe(
          norm(`
  // POST https://example.test/nobody
  const res = http.request(
    'POST',
    parse.url('https://example.test/nobody'),
  )
  check(res, {'status < 400': r => r.status < 400})
        `)
        )
      })
    })
    describe('File / Binary', () => {
      it.skip('emits a placeholder or file handle (TBD)', () => {
        // Intentionally left skipped until file/binary semantics are decided.
        // Example shape once implemented:
        // const req = mkReq({
        //   http: { method: 'post', url: 'https://example.test/upload', auth: 'inherit' },
        //   body: { file: '/path/to/file.bin' } as any,
        // })
        // const out = generateRequest(req).join('\n')
        // expect(norm(out)).toContain(`parse.body(file('...'))`)
      })
    })
  })
})
