import { describe, expect, it } from 'vitest'
import { parseEnv, parseFolder, parseRequest } from '../parser'

describe('parseRequest', () => {
  it('parses a simple GET request with seq as number', () => {
    const src = `meta {
  name: Get Users
  type: http
  seq: 2
}

get {
  url: /users
}`
    const req = parseRequest(src)
    expect(req.meta.name).toBe('Get Users')
    expect(req.meta.type).toBe('http')
    expect(req.meta.seq).toBe(2) // coerced to number
  })
  it('parses an OAuth2 request', () => {
    const src = `meta {
  name: auth-oauth
  type: http
  seq: 14
}

get {
  url: https://example.test/oauth
  body: none
  auth: oauth2
}

auth:oauth2 {
  grant_type: authorization_code
  callback_url: https://example.test/oauth/callback
  authorization_url: https://example.test/oauth/authorize
  access_token_url: https://example.test/token
  refresh_token_url: https://example.test/oauth/token/refresh
  client_id: {{clientId}}
  client_secret: {{secret}}
  scope: read:all
  state: none
  pkce: true
  credentials_placement: basic_auth_header
  credentials_id: credentials
  token_placement: header
  token_header_prefix: Bearer
  auto_fetch_token: true
  auto_refresh_token: true
}

auth:oauth2:additional_params:auth_req:headers {
  extra-key: extra-value
}

auth:oauth2:additional_params:access_token_req:queryparams {
  extra-key: extra-value
}

auth:oauth2:additional_params:refresh_token_req:body {
  extra-key: extra-value
}

settings {
  encodeUrl: true
}
`
    const req = parseRequest(src)
    expect(req).toEqual({
      auth: {
        oauth2: {
          accessTokenUrl: 'https://example.test/token',
          authorizationUrl: 'https://example.test/oauth/authorize',
          autoFetchToken: true,
          autoRefreshToken: true,
          callbackUrl: 'https://example.test/oauth/callback',
          clientId: '{{clientId}}',
          clientSecret: '{{secret}}',
          credentialsId: 'credentials',
          credentialsPlacement: 'basic_auth_header',
          grantType: 'authorization_code',
          pkce: true,
          refreshTokenUrl: 'https://example.test/oauth/token/refresh',
          scope: 'read:all',
          state: 'none',
          tokenHeaderPrefix: 'Bearer',
          tokenPlacement: 'header',
          tokenQueryKey: 'access_token',
        },
      },
      http: {
        auth: 'oauth2',
        body: 'none',
        method: 'get',
        url: 'https://example.test/oauth',
      },
      meta: {
        name: 'auth-oauth',
        seq: 14,
        type: 'http',
      },
      oauth2_additional_parameters_access_token_req_queryparams: [
        {
          enabled: true,
          name: 'extra-key',
          value: 'extra-value',
        },
      ],
      oauth2_additional_parameters_auth_req_headers: [
        {
          enabled: true,
          name: 'extra-key',
          value: 'extra-value',
        },
      ],
      oauth2_additional_parameters_refresh_token_req_bodyvalues: [
        {
          enabled: true,
          name: 'extra-key',
          value: 'extra-value',
        },
      ],
      settings: {
        encodeUrl: true,
      },
    })
  })
  it('parses a graphql request', () => {
    const src = `meta {
  name: body-graphql
  type: http
  seq: 7
}

post {
  url: https://example.test/graphql
  body: graphql
  auth: none
}

body:graphql {
  query Q($id: String!) {
    me {
      id
    }
  }
}

body:graphql:vars {
  {
    "id": "1"
  }
}
`
    const req = parseRequest(src)
    expect(req).toEqual({
      body: {
        graphql: {
          query: `query Q($id: String!) {
  me {
    id
  }
}`,
          variables: `{
  "id": "1"
}`,
        },
      },
      http: {
        auth: 'none',
        body: 'graphql',
        method: 'post',
        url: 'https://example.test/graphql',
      },
      meta: {
        name: 'body-graphql',
        seq: 7,
        type: 'http',
      },
    })
  })
})
describe('parseEnv', () => {
  it('parses environment variables', () => {
    const src = `vars {
  host: dev.example.com
  apiKey: secret123
}`
    const env = parseEnv(src)
    expect(env.variables).toEqual([
      { name: 'host', value: 'dev.example.com', enabled: true, secret: false },
      { name: 'apiKey', value: 'secret123', enabled: true, secret: false },
    ])
  })
})
describe('parseFolder', () => {
  it('parses a folder with seq coerced to number', () => {
    const src = `meta {
  name: Users
  seq: 5
}

auth {
  mode: inherit
}`
    const folder = parseFolder(src)
    expect(folder.meta.type).toBe('folder')
    expect(folder.meta.name).toBe('Users')
    expect(folder.meta.seq).toBe(5)
    expect(folder.auth).toEqual({ mode: 'inherit' })
  })
})
