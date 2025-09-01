// IR - Intermediate Representation
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'

export type BodyMode = 'raw' | 'form' | 'multipart' | 'graphql'
export type AuthType = 'none' | 'basic' | 'bearer' | 'apikey'

export interface IRRequest {
  name: string
  path: string // absolute path to .bru (for comments)
  method: HttpMethod
  url: string // may include {{vars}}
  params: Record<string, string>
  headers: Array<{ key: string; value: string; disabled?: boolean }>
  body?: {
    mode: BodyMode
    mime?: string
    text?: string
    fields?: Record<string, string>
  }
  auth?: {
    type: AuthType
    data?: Record<string, string>
  }
  tests: IRTest[]
  pre?: string // raw JS from script:pre-request
  post?: string // raw JS from script:post-response
  seq?: number
}

// a tiny AST for simple chai-like expectations
export type TestKind = 'statusEq' | 'jsonPathEq' | 'contains' | 'custom'

export interface IRTest {
  name: string
  kind: TestKind
  args: any
  raw?: string // original test line as a fallback
}

export type IRCollection = {
  name: string
  requests: IRRequest[]
  vars: Record<string, string>
}
