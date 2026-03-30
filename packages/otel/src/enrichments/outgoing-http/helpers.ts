import type { ClientRequest, IncomingMessage } from 'node:http'
import { DEFAULT_REQUEST_HEADERS, DEFAULT_RESPONSE_HEADERS } from './consts'
import type { OutgoingHttpEnrichmentConfig, ResolvedConfig } from './types'

export const resolve = (
  opts: OutgoingHttpEnrichmentConfig
): ResolvedConfig => ({
  captureRequestHeaders: opts.captureRequestHeaders ?? DEFAULT_REQUEST_HEADERS,
  captureResponseHeaders:
    opts.captureResponseHeaders ?? DEFAULT_RESPONSE_HEADERS,
  enrichSpan: opts.enrichSpan ?? (() => {}),
  useDescriptiveSpanNames: opts.useDescriptiveSpanNames ?? true,
  ignoreOutgoingPaths: opts.ignoreOutgoingPaths ?? [],
})

export const isClientRequest = (
  req: ClientRequest | IncomingMessage
): req is ClientRequest =>
  typeof (req as ClientRequest).getHeader === 'function'

export const isIncomingMessage = (res: unknown): res is IncomingMessage =>
  res != null &&
  typeof res === 'object' &&
  'statusCode' in res &&
  'headers' in res
