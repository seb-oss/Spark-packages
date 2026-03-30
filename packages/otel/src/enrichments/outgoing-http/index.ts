/**
 * Shared enrichment logic for outgoing HTTP spans, normalised across
 *   @opentelemetry/instrumentation-http  (node:http / node:https)
 *   @opentelemetry/instrumentation-undici (undici / global fetch)
 *
 * Usage:
 *
 *   import { HttpInstrumentation }   from '@opentelemetry/instrumentation-http'
 *   import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
 *   import { buildHttpConfig, buildUndiciConfig } from './instrumentation/outgoing-http'
 *   import type { OutgoingHttpEnrichmentConfig } from './instrumentation/outgoing-http'
 *
 *   const opts: OutgoingHttpEnrichmentConfig = {
 *     captureRequestHeaders: ['x-tenant-id', 'x-request-id'],
 *     captureResponseHeaders: ['x-ratelimit-remaining'],
 *     enrichSpan: (span, req) =>
 *       span.setAttribute('app.tenant.id', req.getHeader('x-tenant-id') ?? ''),
 *     ignoreOutgoingPaths: ['/health', '/ready'],
 *   }
 *
 *   new HttpInstrumentation(buildHttpConfig(opts))
 *   new UndiciInstrumentation(buildUndiciConfig(opts))
 */

export { buildHttpConfig } from './build-http-config'
export { buildUndiciConfig } from './build-undici-config'
export type { OutgoingHttpEnrichmentConfig } from './types'
