import type { Headers, JsonObject } from './types'

export const defaultPort = (target: URL) => {
  if (target.protocol === 'https:' || target.protocol === 'wss:') return 443
  return 80
}

export const toHttpBase = (target: URL) => {
  if (target.protocol.startsWith('ws')) {
    const p = target.protocol === 'wss:' ? 'https:' : 'http:'
    return `${p}//${target.host}`
  }
  return target.toString()
}

export const toWsBase = (target: URL) => {
  if (target.protocol.startsWith('http')) {
    const p = target.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${p}//${target.host}`
  }
  return target.toString()
}

export const getHeader = (headers: Headers, name: string) => {
  const lc = name.toLowerCase()
  const key = Object.keys(headers).find((k) => k.toLowerCase() === lc)
  return key ? headers[key] : undefined
}

export const hasHeader = (headers: Headers, name: string) => {
  const lc = name.toLowerCase()
  return Object.keys(headers).some((k) => k.toLowerCase() === lc)
}

export const setHeader = (headers: Headers, name: string, value: string) => {
  // normalize to lowercase keys for raw write; Node’s http accepts either
  headers[name.toLowerCase()] = value
}

export const flattenHeaders = (headers: Headers) => {
  const out: string[] = []
  for (const [k, v] of Object.entries(headers)) {
    if (v == null) continue

    if (Array.isArray(v)) {
      for (const val of v) {
        out.push(`${k}: ${val}`)
      }
    } else {
      out.push(`${k}: ${String(v)}`)
    }
  }
  return out
}

export class IntrospectionError extends Error {
  constructor(header: string) {
    super(`Could not introspect header '${header}'`)
  }
}

export const parseAuthorizationHeader = (header: string) => {
  try {
    const [, access_token] = header.trim().split(/\s+/, 2)
    const buffer = Buffer.from(access_token, 'base64url')
    const json: JsonObject = JSON.parse(buffer.toString('utf8'))
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      throw new Error('access_token must be base64url encoded JSON object')
    }

    return json
  } catch {
    throw new IntrospectionError(header)
  }
}
