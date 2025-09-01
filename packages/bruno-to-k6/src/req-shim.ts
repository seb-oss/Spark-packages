/** A mutable request draft the shim mutates before the k6 call. */
export type RequestDraft = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
  url: string
  headers: Record<string, string>
  body: string | null
  query: Record<string, string>
}

/** Methods exposed to Bruno pre-request scripts as `req`. */
export interface ReqShim {
  setHeader: (key: string, value: string) => void
  removeHeader: (key: string) => void

  setQueryParam: (key: string, value: string) => void
  setQueryParams: (pairs: Record<string, string>) => void

  setUrl: (next: string) => void
  setBody: (next: string | object | null) => void

  setBearerToken: (token: string) => void
  setBasicAuth: (username: string, password: string) => void
  setApiKey: (
    name: string,
    value: string,
    placement?: 'header' | 'query'
  ) => void
}

/**
 * Create a request shim bound to a mutable draft.
 * All methods mutate the same draft instance (by reference).
 */
export const createReqShim = (draft: RequestDraft): ReqShim => ({
  setHeader: (key, value) => {
    draft.headers[key] = value
  },

  removeHeader: (key) => {
    delete draft.headers[key]
  },

  setQueryParam: (key, value) => {
    draft.query[key] = value
  },

  setQueryParams: (pairs) => {
    for (const [k, v] of Object.entries(pairs)) {
      draft.query[k] = v
    }
  },

  setUrl: (next) => {
    draft.url = next
  },

  setBody: (next) => {
    if (next === null) {
      draft.body = null
    } else if (typeof next === 'string') {
      draft.body = next
    } else {
      draft.body = JSON.stringify(next)
    }
  },

  setBearerToken: (token) => {
    draft.headers.Authorization = `Bearer ${token}`
  },

  setBasicAuth: (username, password) => {
    draft.headers.Authorization = 'Basic ' + b64(`${username}:${password}`)
  },

  setApiKey: (name, value, placement = 'header') => {
    if (placement === 'query') {
      draft.query[name] = value
    } else {
      draft.headers[name] = value
    }
  },
})

// Base64 helper (works in Node & k6)
const b64 = (s: string) =>
  // @ts-ignore btoa may exist in some runtimes
  typeof btoa === 'function'
    ? btoa(s)
    : Buffer.from(s, 'utf8').toString('base64')
