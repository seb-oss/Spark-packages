import type { IncomingMessage, RequestOptions } from 'node:http'
import type { NormalisedRequest, NormalisedResponse, Protocol } from './types'

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
      if (!headers || Array.isArray(headers)) return undefined
      return getHeaderFromObject(headers as Record<string, unknown>, name)
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
      if (typeof value === 'string') return [value]
      return undefined
    }
  }

  return undefined
}
