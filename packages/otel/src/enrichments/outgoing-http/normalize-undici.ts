import type {
  UndiciRequest,
  UndiciResponse,
} from '@opentelemetry/instrumentation-undici'
import type { NormalisedRequest, NormalisedResponse } from './types'

export const normUndiciRequest = (req: UndiciRequest): NormalisedRequest => {
  const origin = new URL(req.origin)
  const protocol = origin.protocol.replace(':', '') as 'http' | 'https'
  const port = Number(origin.port) || (protocol === 'https' ? 443 : 80)

  // Parse "Key: Value\r\nKey2: Value2\r\n" → Map
  const headers = parseUndiciRequestHeaders(req.headers)

  return {
    method: req.method,
    hostname: origin.hostname,
    port,
    path: req.path,
    protocol,
    getHeader: (name) => headers[name.toLowerCase()],
  }
}

export const normUndiciResponse = (res: UndiciResponse): NormalisedResponse => {
  const headers = parseUndiciResponseHeaders(res.headers)

  return {
    statusCode: res.statusCode,
    statusMessage: res.statusText,
    getHeader: (name) => headers[name.toLowerCase()],
  }
}

export const parseUndiciResponseHeaders = (
  headers: Buffer<ArrayBufferLike>[]
): Record<string, string[]> => {
  const result: Record<string, string[]> = {}

  for (let i = 0; i < headers.length; i += 2) {
    const keyBuf = headers[i]
    const valBuf = headers[i + 1]

    if (!keyBuf || !valBuf) continue

    /* istanbul ignore next */
    const key = (
      Buffer.isBuffer(keyBuf)
        ? keyBuf.toString('utf8').trim()
        : Buffer.from(keyBuf as ArrayBuffer)
            .toString('utf8')
            .trim()
    ).toLowerCase()

    /* istanbul ignore next */
    const val = Buffer.isBuffer(valBuf)
      ? valBuf.toString('utf8').trim()
      : Buffer.from(valBuf as ArrayBuffer)
          .toString('utf8')
          .trim()

    if (!key || !val) continue

    if (!result[key]) result[key] = []
    result[key].push(val)
  }

  return result
}

export const parseUndiciRequestHeaders = (
  headers: string | (string | string[])[]
) => {
  const result: Record<string, string[]> = {}

  if (typeof headers === 'string') {
    // Single string format: "key: value"
    const [key, ...rest] = headers.split(':')
    if (key && rest.length > 0) {
      result[key.trim().toLowerCase()] = [rest.join(':').trim()]
    }
  } else {
    // The type union guarantees headers is string | array[]; the else-if is always true
    /* istanbul ignore else */
    if (Array.isArray(headers)) {
      // Array format: [key, value] or [key, [value1, value2]]
      for (let i = 0; i < headers.length; i += 2) {
        const key = headers[i]
        const val = headers[i + 1]
        if (typeof key !== 'string' || val == null) continue

        if (Array.isArray(val)) {
          result[key.toLowerCase()] = val.map((v) => String(v))
        } else {
          result[key.toLowerCase()] = [String(val)]
        }
      }
    }
  }

  return result
}
