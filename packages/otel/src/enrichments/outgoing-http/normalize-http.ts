import type { ClientRequest, IncomingMessage, RequestOptions } from 'node:http'
import type { NormalisedRequest, NormalisedResponse, Protocol } from './types'

const isHeaderList = (headers: unknown): headers is readonly string[] =>
  Array.isArray(headers)

export const normHttpRequest = (req: RequestOptions): NormalisedRequest => {
  const hostname = String(req.hostname ?? req.host ?? '').split(':')[0]
  const port = Number(req.port ?? req.defaultPort ?? 80)
  const path = String(req.path ?? '/')
  const protocol: Protocol = port === 443 ? 'https' : 'http'

  return {
    method: req.method ?? 'GET',
    hostname,
    port,
    path,
    protocol,
    getHeader(name) {
      const headers = req.headers
      if (!headers || isHeaderList(headers)) return undefined
      return getHeaderFromObject(headers, name)
    },
  }
}

/**
 * Normalises an outgoing `ClientRequest`. Unlike `RequestOptions` it has no
 * `port` or `headers`, so the port comes from the `host` header and the
 * scheme from `protocol`.
 */
export const normClientRequest = (req: ClientRequest): NormalisedRequest => {
  const protocol: Protocol = req.protocol === 'https:' ? 'https' : 'http'
  const hostPort = String(req.getHeader('host') ?? '').split(':')[1]
  const port = hostPort ? Number(hostPort) : protocol === 'https' ? 443 : 80

  return {
    method: req.method,
    hostname: req.host,
    port,
    path: req.path,
    protocol,
    getHeader(name) {
      const value = req.getHeader(name)
      if (value === undefined) return undefined
      return Array.isArray(value) ? value : [String(value)]
    },
  }
}

export const normHttpResponse = (res: IncomingMessage): NormalisedResponse => {
  const socket = res.socket
  return {
    statusCode: res.statusCode ?? 0,
    statusMessage: res.statusMessage ?? '',
    getHeader(name) {
      return getHeaderFromObject(res.headers, name)
    },
    remoteAddress: socket?.remoteAddress,
    remotePort: socket?.remotePort,
  }
}

export const getHeaderFromObject = (
  headers: Record<string, unknown> | undefined,
  name: string
): string[] | undefined => {
  if (!headers) return undefined

  const target = name.toLowerCase()

  // Iterate over all keys to find case-insensitive match
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) {
      const value = headers[key]
      if (Array.isArray(value)) return value
      /* istanbul ignore next */
      if (typeof value === 'string') return [value]
      /* istanbul ignore next */
      return undefined
    }
  }

  return undefined
}
