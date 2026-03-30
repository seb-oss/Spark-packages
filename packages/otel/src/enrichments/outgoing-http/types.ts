import type { Span } from '@opentelemetry/api'
import type { PROTOCOLS } from './consts'

export type Protocol = (typeof PROTOCOLS)[number]

// ─── Normalised shapes ────────────────────────────────────────────────────────
// Both adapters reduce their native request/response objects to these interfaces
// so all enrichment logic is written once.

export type NormalizedHeaderValue = string | string[]
export type NormalizedHeaders = Record<string, NormalizedHeaderValue>

export interface NormalisedRequest {
  method: string
  hostname: string
  port: number
  /** Full path including query string, e.g. "/users?page=2" */
  path: string
  protocol: Protocol
  /** Case-insensitive header lookup returns the first value or undefined. */
  getHeader(name: string): string[] | undefined
}

export interface NormalisedResponse {
  statusCode: number
  statusMessage: string
  /** Case-insensitive header lookup returns the first value or undefined. */
  getHeader(name: string): string[] | undefined
  /** Resolved wire address — available after the TCP connection is made. */
  remoteAddress?: string
  remotePort?: number
}

// ─── Public config ────────────────────────────────────────────────────────────

export interface OutgoingHttpEnrichmentConfig {
  /**
   * Request headers to capture as span attributes.
   * Defaults to a conservative safe set — Authorization is never included.
   */
  captureRequestHeaders?: string[]

  /** Response headers to capture as span attributes. */
  captureResponseHeaders?: string[]

  /**
   * Optional app-level hook that fires after all standard attributes are set.
   * Receives the normalised request so you don't need to know whether you're
   * in an http or undici context.
   */
  enrichSpan?: (span: Span, request: NormalisedRequest) => void

  /**
   * Rename each outgoing span to "METHOD hostname/path" instead of just "METHOD".
   * Defaults to true.
   */
  useDescriptiveSpanNames?: boolean

  /**
   * Outgoing request paths to skip entirely (case-insensitive prefix match).
   * e.g. ['/health', '/ready', '/_internal']
   */
  ignoreOutgoingPaths?: string[]
}

export type ResolvedConfig = Required<OutgoingHttpEnrichmentConfig>
