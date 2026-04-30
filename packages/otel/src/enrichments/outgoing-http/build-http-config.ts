import type { Attributes } from '@opentelemetry/api'
import type { HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http'
import {
  ATTR_HTTP_REQUEST_METHOD,
  ATTR_NETWORK_PEER_ADDRESS,
  ATTR_NETWORK_PEER_PORT,
  ATTR_NETWORK_PROTOCOL_VERSION,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_URL_FULL,
  ATTR_URL_PATH,
  ATTR_URL_SCHEME,
} from '@opentelemetry/semantic-conventions'
import {
  applyRequestAttributes,
  applyResponseAttributes,
} from './apply-attributes'
import { isClientRequest, isIncomingMessage, resolve } from './helpers'
import { normHttpRequest, normHttpResponse } from './normalize-http'
import type { OutgoingHttpEnrichmentConfig } from './types'

/**
 * Build an HttpInstrumentationConfig that applies shared enrichment logic.
 *
 * The returned config can be spread with your own additional options:
 *   new HttpInstrumentation({ ...buildHttpConfig(opts), serverName: 'gateway' })
 */
export const buildHttpConfig = (
  opts: OutgoingHttpEnrichmentConfig = {}
): HttpInstrumentationConfig => {
  const cfg = resolve(opts)

  const config: HttpInstrumentationConfig = {
    enabled: opts.enabled,
    ignoreOutgoingRequestHook(req) {
      if (!cfg.ignoreOutgoingPaths.length) return false
      const path = req.path ?? ''
      return cfg.ignoreOutgoingPaths.some((p) =>
        path.toLowerCase().startsWith(p.toLowerCase())
      )
    },

    // startOutgoingSpanHook fires at span creation time — before any proxy or
    // service-mesh sidecar can rewrite the destination socket.  The returned
    // attributes are the "ground truth" hostname we captured off the wire.
    startOutgoingSpanHook(req) {
      const { method, hostname, port, path, protocol } = normHttpRequest(req)
      const [urlPath] = path.split('?')
      const defaultPort = protocol === 'https' ? 443 : 80
      const portSuffix = port !== defaultPort ? `:${port}` : ''
      /* istanbul ignore next */
      const resolvedUrlPath = urlPath ?? '/'

      const attrs: Attributes = {
        [ATTR_HTTP_REQUEST_METHOD]: method.toUpperCase(),
        [ATTR_SERVER_ADDRESS]: hostname,
        [ATTR_SERVER_PORT]: port,
        [ATTR_URL_SCHEME]: protocol,
        [ATTR_URL_PATH]: resolvedUrlPath,
        [ATTR_URL_FULL]: `${protocol}://${hostname}${portSuffix}${path}`,
        [ATTR_NETWORK_PEER_ADDRESS]: hostname,
        [ATTR_NETWORK_PEER_PORT]: port,
      }
      /* istanbul ignore next */
      for (const [key, val] of Object.entries(req.headers || {})) {
        if (!val) continue

        const name = key.toLowerCase().replace(/-/g, '_')
        const value = Array.isArray(val) ? val.join(',') : val
        attrs[`http.request.header.${name}`] = value
      }
      return attrs
    },

    requestHook(span, request) {
      // requestHook fires for both incoming (IncomingMessage) and outgoing
      // (ClientRequest) spans — skip the incoming side.
      if (!isClientRequest(request)) return

      // HTTP version isn't always accessible here, but try to read it.
      const proto = request.protocol
      if (proto) {
        span.setAttribute(
          ATTR_NETWORK_PROTOCOL_VERSION,
          /* istanbul ignore next */
          proto === 'https:' ? '1.1' : '1.1'
        )
      }

      applyRequestAttributes(span, normHttpRequest(request), cfg)
    },

    responseHook(span, response) {
      if (!isIncomingMessage(response)) return
      applyResponseAttributes(span, normHttpResponse(response), cfg)
    },
  }

  return config
}
